import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)
sftp = c.open_sftp()

def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:600])
    if err: print('[ERR]', err[:300])
    return out

# 直接用 sed 注释掉 nginx.conf 中的 server 块
# server 块在第 38-55 行左右，直接用行号注释
print('=== 查看 nginx.conf server 块行号 ===')
run('grep -n "server {" /etc/nginx/nginx.conf')
run('wc -l /etc/nginx/nginx.conf')

# 恢复备份，重新操作
run('cp /etc/nginx/nginx.conf.bak /etc/nginx/nginx.conf')

# 用 awk 注释掉第一个 server 块
awk_script = """
awk '
BEGIN { in_block=0; brace=0; found=0 }
/^    server[[:space:]]*{/ && !found {
  in_block=1
  found=1
  brace=1
  print "#" $0
  next
}
in_block {
  brace += gsub(/{/,"{",$0) - gsub(/}/,"}",$0)
  print "#" $0
  if (brace <= 0) in_block=0
  next
}
{ print }
' /etc/nginx/nginx.conf > /tmp/nginx_new.conf && mv /tmp/nginx_new.conf /etc/nginx/nginx.conf
"""
run(awk_script.strip())
run('nginx -t 2>&1')
run('nginx -s reload 2>&1')

import time
time.sleep(1)
print('\n=== 验证 ===')
run('curl -s http://localhost/api/health')
run('curl -si http://localhost/ | head -3')

print('\nDone!')
sftp.close()
c.close()
