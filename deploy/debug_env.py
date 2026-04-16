import paramiko
import time

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:800])
    if err and 'Warning' not in err: print('[ERR]', err[:300])
    return out

# 直接在 cwd=/opt/outdoor-fund/server 下运行 node，测试环境变量
print('=== 直接测试 node 是否能读 .env ===')
run("""cd /opt/outdoor-fund/server && node -e "
require('dotenv/config');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? process.env.JWT_SECRET.slice(0,10) + '...' : 'MISSING');
console.log('DB:', process.env.DATABASE_PATH);
" """)

# 测试当前进程的实际 env（不通过 pm2）
print('\n=== 直接启动 server 测试登录 ===')
# 先杀掉 pm2
run('pm2 stop outdoor-fund')
time.sleep(1)

# 直接用 node 启动，注入 env
run("""cd /opt/outdoor-fund/server && JWT_SECRET=294b3bc3ddf84c0f3584b3f806009c00ae38d554b63932cbfdc2600a0f0288e1 DATABASE_PATH=/opt/outdoor-fund/data/outdoor.db PORT=3001 NODE_ENV=production node dist/server/src/index.js &
sleep 3
curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"groupId":1,"password":"outdoor2024"}'
kill %1 2>/dev/null
true""", timeout=15)

# 恢复 pm2
run('pm2 start outdoor-fund')
time.sleep(2)

# 看 pm2 错误日志
print('\n=== pm2 error log ===')
run('tail -20 /root/.pm2/logs/outdoor-fund-error.log')

print('\nDone!')
c.close()
