"""ip2region xdb v3 离线查询(IPv4 + IPv6),只用标准库。

数据文件来自 github.com/lionsoul2014/ip2region/data/(Apache-2.0),
放在本文件同目录: ip2region_v4.xdb / ip2region_v6.xdb。
IPv4 段索引按小端存,IPv6 按大端存,所以两者比较方向不同。
"""
import ipaddress
import mmap
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))


class _Xdb:
    def __init__(self, path, nbytes):
        self.n = nbytes
        self.seg = nbytes * 2 + 6
        self._f = open(path, "rb")
        self.mm = mmap.mmap(self._f.fileno(), 0, access=mmap.ACCESS_READ)

    def _cmp(self, ip, off):
        mm, n = self.mm, self.n
        if n == 4:
            for i in range(4):
                a, b = ip[i], mm[off + 3 - i]
                if a != b:
                    return -1 if a < b else 1
            return 0
        seg = mm[off:off + n]
        return (ip > seg) - (ip < seg)

    def search(self, ip):
        idx = 256 + (ip[0] * 256 + ip[1]) * 8
        s_ptr, e_ptr = struct.unpack_from("<II", self.mm, idx)
        lo, hi = 0, (e_ptr - s_ptr) // self.seg
        while lo <= hi:
            mid = (lo + hi) >> 1
            p = s_ptr + mid * self.seg
            if self._cmp(ip, p) < 0:
                hi = mid - 1
            elif self._cmp(ip, p + self.n) > 0:
                lo = mid + 1
            else:
                dlen, dptr = struct.unpack_from("<HI", self.mm, p + self.n * 2)
                return self.mm[dptr:dptr + dlen].decode("utf-8", "replace")
        return ""


_dbs = {}


def _db(version):
    if version not in _dbs:
        path = os.path.join(HERE, "ip2region_v%d.xdb" % version)
        _dbs[version] = _Xdb(path, 4 if version == 4 else 16) if os.path.exists(path) else None
    return _dbs[version]


def _clean(v):
    v = (v or "").strip()
    return "" if v in ("0", "Reserved", "内网IP") else v


def lookup(ip):
    """返回 dict(country, province, city, isp);查不到的字段为空串。"""
    out = {"country": "", "province": "", "city": "", "isp": ""}
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return out
    if addr.is_private or addr.is_loopback:
        out["country"] = "内网"
        return out
    db = _db(addr.version)
    if db is None:
        return out
    parts = db.search(addr.packed).split("|")
    # 新版数据: 国家|省份|城市|ISP|国家码
    if len(parts) >= 4:
        out["country"], out["province"], out["city"], out["isp"] = (_clean(x) for x in parts[:4])
    return out


if __name__ == "__main__":
    import sys
    for a in sys.argv[1:]:
        print(a, lookup(a))
