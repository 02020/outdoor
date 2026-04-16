import paramiko
import asyncio

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
    if err: print('[ERR]', err[:300])
    return out

# 调用创建群组 API 创建默认群组
print('=== 创建默认群组 [猹瓜瞒] ===')
# 用 curl 直接调 API，这样密码会被 bcrypt 正确 hash
result = run("""curl -s -X POST http://localhost:3000/api/auth/groups \
  -H 'Content-Type: application/json' \
  -d '{"name":"猹瓜瞒","adminPassword":"caguaddie2024","memberPassword":"outdoor2024","description":"猹瓜瞒户外公积金群"}' """)
print('Result:', result)

# 查看群组列表确认
print('\n=== 当前群组列表 ===')
run('curl -s http://localhost:3000/api/auth/groups')

print('\nDone!')
c.close()
