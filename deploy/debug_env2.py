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

# 查看运行中进程的 pid 和环境变量
run("pm2 show outdoor-fund 2>&1 | head -15")
pid = run("pgrep -f 'outdoor-fund/server/dist' | head -1")
print('PID:', pid)

if pid:
    run(f"cat /proc/{pid}/environ | tr '\\0' '\\n' | grep -E 'JWT|DATABASE|PORT|NODE_ENV|HOME|PWD'")
    run(f"ls -la /proc/{pid}/cwd")

# 也看下 pm2 logs
run('tail -15 /root/.pm2/logs/outdoor-fund-out.log')
run('tail -10 /root/.pm2/logs/outdoor-fund-error.log')

# 看一下 dist/server/src/index.js 实际上如何加载 dotenv 的
run('head -5 /opt/outdoor-fund/server/dist/server/src/index.js')

print('\nDone!')
c.close()
