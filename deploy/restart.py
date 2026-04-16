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
    if err: print('[ERR]', err[:400])
    return out

# 看 pm2 进程信息
run('pm2 show outdoor-fund 2>&1 | head -30')

# 杀掉所有 node 进程，重新用正确路径启动
print('\n=== 重新启动 ===')
run('pm2 delete outdoor-fund 2>/dev/null; pkill -f "outdoor-fund" 2>/dev/null; sleep 1; true')
run('lsof -i :3000 2>/dev/null | head -5')

# 重新用正确路径启动
run('cd /opt/outdoor-fund && pm2 start server/dist/server/src/index.js --name outdoor-fund')
run('pm2 status')

import time
time.sleep(3)
run('curl -s http://localhost:3000/api/health')
run('pm2 logs outdoor-fund --lines 5 --nostream 2>&1')

print('\nDone!')
c.close()
