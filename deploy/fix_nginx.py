import paramiko

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
    if out: print(out[:1200])
    if err: print('[ERR]', err[:300])
    return out

# 检查 nginx.conf 里是否有 server 块
run('grep -n "server" /etc/nginx/nginx.conf')
run('grep -n "listen" /etc/nginx/nginx.conf')

# 检查 include 了哪些额外配置
run('grep "include" /etc/nginx/nginx.conf')

# 检查所有 conf.d 文件
run('ls -la /etc/nginx/conf.d/')

# 查看 80 端口监听情况
run('ss -tlnp | grep :80')

# 直接测试 outdoor-fund conf 是否生效（用 server_name 替换掉 _ 改为 ip）
# 先把 outdoor-fund.conf 里的 server_name 改为唯一
run("""sed -i 's/server_name _;/server_name 223.6.248.243 default_server;/' /etc/nginx/conf.d/outdoor-fund.conf""")
run('cat /etc/nginx/conf.d/outdoor-fund.conf | head -5')
run('nginx -t 2>&1')
run('nginx -s reload 2>&1')

# 验证
import time
time.sleep(1)
run('curl -s http://localhost/api/health')
run('curl -si http://localhost/ | head -3')

print('\nDone!')
c.close()
