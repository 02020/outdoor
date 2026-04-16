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

# delete then start fresh to pick up new env
run('pm2 delete outdoor-fund 2>/dev/null; true')
time.sleep(1)
run('cd /opt/outdoor-fund && pm2 start ecosystem.config.cjs')
time.sleep(3)

# 验证进程 env
run("pm2 env 0 2>&1 | grep -E 'JWT_SECRET|DATABASE_PATH|PORT' | head -5")

# 验证登录
print('\n=== 验证登录 ===')
r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Member login:', r[:300])

run('pm2 save')
print('\nDone!')
c.close()
