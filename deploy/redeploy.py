import paramiko
import os

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'
BASE = r'd:\Er\io\outdoor'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)
sftp = c.open_sftp()

def run(cmd, timeout=180):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:600])
    if err: print('[ERR]', err[:300])
    return out

def upload_dir(local_dir, remote_dir):
    run(f'mkdir -p {remote_dir}')
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isdir(local_path):
            upload_dir(local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)

# 1. 清空旧 dist，重传新的
print('=== 清理旧 dist ===')
run('rm -rf /opt/outdoor-fund/server/dist')

print('=== 上传新 server/dist ===')
upload_dir(os.path.join(BASE, 'server', 'dist'), '/opt/outdoor-fund/server/dist')

# 2. 上传 package.json (已去掉 type:module)
sftp.put(os.path.join(BASE, 'server', 'package.json'), '/opt/outdoor-fund/server/package.json')
print('server/package.json uploaded')

# 3. 上传 migrations 目录（数据库迁移文件）
print('=== 上传 migrations ===')
upload_dir(os.path.join(BASE, 'server', 'src', 'db', 'migrations'), '/opt/outdoor-fund/server/migrations')

# 4. 生成生产环境 .env
print('=== 写入生产 .env ===')
import secrets
jwt_secret = secrets.token_hex(32)
env_lines = [
    'DATABASE_PATH=/opt/outdoor-fund/data/outdoor.db',
    f'JWT_SECRET={jwt_secret}',
    'PORT=3000',
    'NODE_ENV=production',
]
env_content = '\n'.join(env_lines) + '\n'
# 写到服务器
stdin, _, _ = c.exec_command('cat > /opt/outdoor-fund/server/.env')
stdin.write(env_content)
stdin.channel.shutdown_write()
print('  .env written')
run('cat /opt/outdoor-fund/server/.env')

# 5. 测试运行
print('\n=== 测试启动 server ===')
run('cd /opt/outdoor-fund && node server/dist/server/src/index.js &\nsleep 3\ncurl -s http://localhost:3000/api/health\nkill %1 2>/dev/null\ntrue', timeout=15)

sftp.close()
c.close()
print('\nDone!')
