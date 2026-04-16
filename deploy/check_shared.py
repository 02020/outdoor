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
    if out: print(out[:600])
    if err: print('[ERR]', err[:400])
    return out

# 查看 node_modules 里 shared 的链接方式
print('=== 检查 shared 包 ===')
run('ls -la /opt/outdoor-fund/node_modules/@outdoor-fund/')
run('cat /opt/outdoor-fund/node_modules/@outdoor-fund/shared/package.json')
run('ls /opt/outdoor-fund/node_modules/@outdoor-fund/shared/')

print('\nDiag done!')
c.close()
