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

# 方案：在服务器上修改 dist/server/src/index.js 的 dotenv 加载行
# 改为用绝对路径，避免 cwd 问题
run('head -10 /opt/outdoor-fund/server/dist/server/src/index.js')

# 替换 require("dotenv/config") 为使用绝对路径
run(r"""sed -i 's|require("dotenv/config")|require("dotenv").config({ path: "/opt/outdoor-fund/server/.env" })|' /opt/outdoor-fund/server/dist/server/src/index.js""")

# 验证替换
run('head -10 /opt/outdoor-fund/server/dist/server/src/index.js')

# 重启 PM2 
run('pm2 restart outdoor-fund')
time.sleep(4)

# 验证
print('\n=== 验证登录 ===')
r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Member login:', r[:300])

r2 = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"caguaddie2024"}' """)
print('Admin login:', r2[:200])

run('pm2 save')
print('\nDone!')
c.close()
