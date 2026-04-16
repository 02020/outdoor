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
    if out: print(out[:600])
    if err and 'Warning' not in err: print('[ERR]', err[:300])
    return out

# 看 pm2 进程当前的工作目录
print('=== pm2 cwd ===')
run("pm2 show outdoor-fund 2>&1 | grep -E 'cwd|exec cwd|pwd|script path'")

# 直接用 env 变量方式启动，绕过 dotenv
run('pm2 delete outdoor-fund 2>/dev/null; pkill -9 -f "outdoor-fund/server/dist" 2>/dev/null; sleep 1; true')
run('lsof -i :3000 2>/dev/null | head -3')

# 直接用环境变量注入方式
run('''pm2 start /opt/outdoor-fund/server/dist/server/src/index.js \
  --name outdoor-fund \
  --cwd /opt/outdoor-fund/server \
  --env production''')
run('pm2 status')
time.sleep(3)

# check actual env in process
print('\n=== process env ===')
pid = run("pm2 show outdoor-fund 2>&1 | grep '│ pid' | awk '{print $4}'")
if pid and pid.isdigit():
    run(f"cat /proc/{pid}/environ 2>/dev/null | tr '\\0' '\\n' | grep -E 'JWT|DATABASE|PORT|NODE_ENV'")

r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Login:', r[:300])

run('pm2 save')
print('\nDone!')
c.close()
