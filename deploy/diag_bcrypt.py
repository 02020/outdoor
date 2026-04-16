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

# 1. 测试 bcrypt 是否正常
print('=== 测试 bcrypt ===')
run("node -e \"const b = require('/opt/outdoor-fund/node_modules/bcrypt'); b.hash('test',10).then(h=>console.log('bcrypt OK:',h.slice(0,10))).catch(e=>console.error('bcrypt ERR:',e.message))\" 2>&1", timeout=15)

# 2. 查看 bcrypt 编译情况
run('ls /opt/outdoor-fund/node_modules/bcrypt/lib/binding/')
run('file /opt/outdoor-fund/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node 2>/dev/null || echo "no binding"')

# 3. 查看 PM2 日志里的 500 错误详情
print('\n=== PM2 error logs ===')
run('pm2 logs outdoor-fund --lines 30 --nostream --err 2>&1')

print('\nDone!')
c.close()
