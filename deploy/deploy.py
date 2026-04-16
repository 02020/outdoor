#!/usr/bin/env python3
"""
户外公积金管理系统 - 阿里云部署脚本
用法: python deploy.py
"""
import paramiko
import os
import sys
import secrets
import time

# 配置
HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'
BASE = r'd:\Er\io\outdoor'
REMOTE_BASE = '/opt/outdoor-fund'

def run_remote(c, cmd, timeout=60):
    """在远程服务器执行命令"""
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f'  $ {cmd[:80]}')
    if out: print(f'  {out[:500]}')
    if err and 'WARN' not in err: print(f'  [ERR] {err[:200]}')
    return out

def upload_dir(sftp, local_dir, remote_dir):
    """递归上传目录"""
    run_remote(c, f'mkdir -p {remote_dir}')
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)

def main():
    print('='*60)
    print('户外公积金管理系统 - 部署到阿里云')
    print('='*60)
    
    # 连接服务器
    print('\n[1/6] 连接服务器...')
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASS, timeout=15)
    sftp = c.open_sftp()
    print('  ✅ 已连接')
    
    # 上传文件
    print('\n[2/6] 上传文件...')
    upload_dir(sftp, os.path.join(BASE, 'server', 'dist'), f'{REMOTE_BASE}/server/dist')
    sftp.put(os.path.join(BASE, 'server', 'package.json'), f'{REMOTE_BASE}/server/package.json')
    upload_dir(sftp, os.path.join(BASE, 'shared', 'src'), f'{REMOTE_BASE}/shared/src')
    sftp.put(os.path.join(BASE, 'shared', 'package.json'), f'{REMOTE_BASE}/shared/package.json')
    upload_dir(sftp, os.path.join(BASE, 'client', 'dist'), f'{REMOTE_BASE}/client')
    print('  ✅ 文件上传完成')
    
    # 修复 shared 包路径
    print('\n[3/6] 配置 shared 包...')
    import json
    pkg_path = f'{REMOTE_BASE}/shared/package.json'
    with sftp.open(pkg_path, 'r') as f:
        pkg = json.loads(f.read())
    pkg['main'] = '../server/dist/shared/src/index.js'
    pkg['types'] = '../server/dist/shared/src/index.d.ts'
    with sftp.open(pkg_path, 'w') as f:
        f.write(json.dumps(pkg, indent=2))
    print('  ✅ shared 包路径已修复')
    
    # 创建 PM2 配置
    print('\n[4/6] 创建 PM2 配置...')
    jwt_secret = secrets.token_hex(32)
    ecosystem = f"""module.exports = {{
  apps: [{{
    name: 'outdoor-fund',
    script: './server/dist/server/src/index.js',
    cwd: '{REMOTE_BASE}',
    instances: 1,
    exec_mode: 'fork',
    env: {{
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_PATH: '{REMOTE_BASE}/data/outdoor.db',
      JWT_SECRET: '{jwt_secret}'
    }}
  }}]
}}"""
    with sftp.open(f'{REMOTE_BASE}/ecosystem.config.js', 'w') as f:
        f.write(ecosystem)
    print(f'  ✅ JWT_SECRET: {jwt_secret[:16]}...')
    
    # 启动服务
    print('\n[5/6] 启动服务...')
    run_remote(c, 'pm2 delete outdoor-fund 2>/dev/null || true')
    run_remote(c, f'cd {REMOTE_BASE} && pm2 start ecosystem.config.js', timeout=30)
    time.sleep(3)
    run_remote(c, 'pm2 save')
    print('  ✅ 服务已启动')
    
    # 验证
    print('\n[6/6] 验证部署...')
    result = run_remote(c, 'curl -s http://localhost:3000/api/auth/groups')
    if '"code":0' in result:
        print('  ✅ API 测试通过')
    else:
        print('  ⚠️ API 测试可能有问题')
    
    sftp.close()
    c.close()
    
    print('\n' + '='*60)
    print('部署完成！')
    print(f'访问地址: http://{HOST}')
    print('='*60)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n❌ 部署失败: {e}')
        sys.exit(1)
