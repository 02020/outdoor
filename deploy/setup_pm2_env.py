import paramiko
import secrets

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

try:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASS, timeout=15)

    def run(cmd, timeout=30):
        _, o, e = c.exec_command(cmd, timeout=timeout)
        o.channel.recv_exit_status()
        out = o.read().decode().strip()
        err = e.read().decode().strip()
        print(out[:400] if out else '')
        if err and 'ERR' in err[:50]: print('[ERR]', err[:200])
        return out

    # 1. 删除符号链接，创建真实文件
    print('=== 创建真实的 .env 文件 ===')
    run('rm -f /opt/outdoor-fund/server/dist/.env')
    
    jwt_secret = secrets.token_hex(32)
    env_content = f"""DATABASE_PATH=/opt/outdoor-fund/data/outdoor.db
JWT_SECRET={jwt_secret}
PORT=3000
NODE_ENV=production
"""
    
    sftp = c.open_sftp()
    with sftp.open('/opt/outdoor-fund/server/dist/.env', 'w') as f:
        f.write(env_content)
    sftp.close()
    
    run('cat /opt/outdoor-fund/server/dist/.env')
    run('ls -la /opt/outdoor-fund/server/dist/.env')

    # 2. 停止所有
    print('\n=== 清理进程 ===')
    run('pm2 delete all 2>/dev/null || true')
    run('pkill -9 -f node 2>/dev/null || true')
    
    import time
    time.sleep(2)

    # 3. 使用 PM2 ecosystem 文件启动（确保环境变量加载）
    print('\n=== 创建 PM2 配置 ===')
    ecosystem = f"""module.exports = {{
  apps: [{{
    name: 'outdoor-fund',
    script: './server/dist/server/src/index.js',
    cwd: '/opt/outdoor-fund',
    instances: 1,
    exec_mode: 'fork',
    env: {{
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_PATH: '/opt/outdoor-fund/data/outdoor.db',
      JWT_SECRET: '{jwt_secret}'
    }}
  }}]
}}"""
    
    import os
    temp_file = os.path.join(os.environ.get('TEMP', '/tmp'), 'ecosystem.config.js')
    with open(temp_file, 'w') as f:
        f.write(ecosystem)
    
    sftp = c.open_sftp()
    sftp.put(temp_file, '/opt/outdoor-fund/ecosystem.config.js')
    sftp.close()
    
    run('cat /opt/outdoor-fund/ecosystem.config.js')

    # 4. 启动
    print('\n=== 启动服务 ===')
    run('cd /opt/outdoor-fund && pm2 start ecosystem.config.js', timeout=30)
    
    time.sleep(4)

    # 5. 检查
    print('\n=== 服务状态 ===')
    run('pm2 logs outdoor-fund --lines 8 --nostream')

    # 6. 测试
    print('\n=== 测试登录 ===')
    run("curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"groupName\":\"猹瓜瞒\",\"password\":\"caguaddie2024\"}'")

    c.close()
    print('\n✅ 完成')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
