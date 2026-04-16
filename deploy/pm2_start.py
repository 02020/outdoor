import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:800])
    if err: print('[ERR]', err[:300])
    return out

# 1. 先执行数据库迁移
print('=== 执行数据库迁移 ===')
run('cd /opt/outdoor-fund && node server/dist/server/src/db/migrate.js 2>&1')

# 2. 用 PM2 启动 server
print('\n=== PM2 启动 server ===')
run('pm2 delete outdoor-fund 2>/dev/null || true')
run('cd /opt/outdoor-fund && pm2 start server/dist/server/src/index.js --name outdoor-fund --env production')
run('pm2 status')
run('pm2 logs outdoor-fund --lines 10 --nostream')

# 3. 健康检查
import time
time.sleep(2)
run('curl -s http://localhost:3000/api/health')

# 4. PM2 开机自启
print('\n=== 设置 PM2 开机自启 ===')
run('pm2 startup systemd -u root --hp /root 2>&1 | tail -3')
run('pm2 save')

print('\nPM2 startup done!')
c.close()
