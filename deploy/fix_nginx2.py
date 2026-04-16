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
    if out: print(out[:600])
    if err: print('[ERR]', err[:300])
    return out

# 备份 nginx.conf
run('cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak')

# 用 Python 在服务器上直接修改 nginx.conf：
# 注释掉内置的 server 块（第38行开始的 server { listen 80... }）
fix_script = r"""
import re

with open('/etc/nginx/nginx.conf', 'r') as f:
    content = f.read()

# 找到并注释掉内置 server 块
# 匹配 "    server {" 到对应的闭合 "    }"
# nginx.conf 里的 server 块缩进是 4 个空格
lines = content.split('\n')
new_lines = []
in_server = False
brace_count = 0
server_start = -1

for i, line in enumerate(lines):
    # 检测 server 块开始（4空格缩进，不是注释）
    if not in_server and re.match(r'^    server\s*\{', line):
        in_server = True
        brace_count = line.count('{') - line.count('}')
        server_start = i
        new_lines.append('#' + line)
    elif in_server:
        brace_count += line.count('{') - line.count('}')
        new_lines.append('#' + line)
        if brace_count <= 0:
            in_server = False
    else:
        new_lines.append(line)

with open('/etc/nginx/nginx.conf', 'w') as f:
    f.write('\n'.join(new_lines))

print('Done')
"""

run(f"python3 -c '{fix_script}'")

# 验证修改
run('grep -n "^#    server" /etc/nginx/nginx.conf | head -5')
run('nginx -t 2>&1')
run('nginx -s reload 2>&1')

import time
time.sleep(1)
print('\n=== 验证 ===')
run('curl -s http://localhost/api/health')
run('curl -si http://localhost/ | head -3')

print('\nDone!')
c.close()
