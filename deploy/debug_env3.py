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

# dotenv 查看，__dirname 是编译后的路径
run('cat /opt/outdoor-fund/server/dist/server/src/index.js | head -20')

# dotenv/config 在 CJS 模式下从哪里找 .env？
# dotenv 默认从 process.cwd() 找 .env，而不是 __dirname
# 但 PM2 的 EADDRINUSE 说明进程一直在崩溃重启
# 先杀掉所有 node 进程
print('\n=== 解决端口冲突 ===')
run('pkill -9 node 2>/dev/null; sleep 2; true')
run('lsof -i :3000 2>/dev/null')

# 重新启动
run('cd /opt/outdoor-fund && pm2 start ecosystem.config.cjs')
time.sleep(4)

# 看 dotenv 能否找到 .env，直接测试
# dotenv 用 process.cwd() 所以 cwd=/opt/outdoor-fund/server 时应该能找到
run('ls -la /opt/outdoor-fund/server/.env')
run("cd /opt/outdoor-fund/server && node -e \"require('dotenv/config'); console.log(process.env.JWT_SECRET ? 'JWT OK' : 'JWT MISSING')\"")

# 直接启动 node，不用 pm2，看能否正常登录  
run('pm2 stop outdoor-fund')
time.sleep(1)
pid_result = run('cd /opt/outdoor-fund/server && nohup node dist/server/src/index.js > /tmp/server.log 2>&1 & echo $!')
print('nohup pid:', pid_result)
time.sleep(3)
run('cat /tmp/server.log')
r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Login:', r[:300])

# 杀掉 nohup 进程
run(f'kill {pid_result} 2>/dev/null; true')
time.sleep(1)

# 重启 pm2
run('cd /opt/outdoor-fund && pm2 start ecosystem.config.cjs')
run('pm2 save')

print('\nDone!')
c.close()
