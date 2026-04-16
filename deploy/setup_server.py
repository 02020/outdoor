import paramiko, os

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=120):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:500])
    if err: print('[ERR]', err[:300])
    return out

# 检查 server 入口文件实际路径
run('find /opt/outdoor-fund/server/dist -name "index.js" | head -5')
run('ls /opt/outdoor-fund/server/dist/')

# 安装生产依赖（在 server 目录）
print('\n=== 安装服务器依赖 ===')
run('cd /opt/outdoor-fund/server && npm install --omit=dev 2>&1 | tail -5', timeout=180)

# 写入生产环境 .env
print('\n=== 写入 .env ===')
import secrets
jwt_secret = secrets.token_hex(32)
env_content = f"""DATABASE_PATH=/opt/outdoor-fund/data/outdoor.db
JWT_SECRET={jwt_secret}
PORT=3000
NODE_ENV=production
"""
run(f'cat > /opt/outdoor-fund/server/.env << \'ENVEOF\'\n{env_content}ENVEOF')
run('cat /opt/outdoor-fund/server/.env')

print('\nSetup done!')
c.close()
