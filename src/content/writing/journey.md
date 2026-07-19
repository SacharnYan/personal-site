---
title: "探秘之旅"
sub: "谜面藏在源码的 //TODO 里。"
date: 2021-08-20
description: "网上冲浪遇到一个谜语人，把密码一层层藏在编码里，等人破解。"
tags: ["趣事", "技术"]
---

分享一个在网上冲浪时遇到的故事：一个谜语人把密码藏在编码中，等人破解。

加密人说，他把谜面留在了源码的 `//TODO` 中。打开源码，找到他留下的谜面：

```
\u0061\u0048\u0052\u0030\u0063\u0044\u006f\u0076\u004c\u0032\u0052\u006c\u0064\u0069\u0031\u007a\u0061\u0057\u0052\u006c\u0059\u0032\u0046\u0079\u004c\u006d\u0052\u0076\u0059\u0032\u0031\u0070\u0063\u006e\u004a\u0076\u0063\u0069\u0035\u006a\u0062\u0069\u0039\u0035\u0062\u0033\u0056\u006d\u0061\u0057\u0035\u006b\u0061\u0058\u0051\u0076\u0061\u0057\u0035\u006b\u005a\u0058\u0067\u0075\u0061\u0048\u0052\u0074\u0062\u0041\u003d\u003d
```

以下是我的解密之路。

发现这是 Unicode，先用 IDEA 调一个 Unicode 转 String 的方法，解谜一层：

```java
public static void main(String[] args) {
    String a = "\\u0061\\u0048\\u0052\\u0030\\u0063\\u0044\\u006f\\u0076\\u004c\\u0032\\u0052\\u006c\\u0064\\u0069\\u0031\\u007a\\u0061\\u0057\\u0052\\u006c\\u0059\\u0032\\u0046\\u0079\\u004c\\u006d\\u0052\\u0076\\u0059\\u0032\\u0031\\u0070\\u0063\\u006e\\u004a\\u0076\\u0063\\u0069\\u0035\\u006a\\u0062\\u0069\\u0039\\u0035\\u0062\\u0033\\u0056\\u006d\\u0061\\u0057\\u0035\\u006b\\u0061\\u0058\\u0051\\u0076\\u0061\\u0057\\u0035\\u006b\\u005a\\u0058\\u0067\\u0075\\u0061\\u0048\\u0052\\u0074\\u0062\\u0041\\u003d\\u003d";
    String s = unicode2String(a);
    System.out.println(s);
}

public static String unicode2String(String unicode) {
    StringBuffer string = new StringBuffer();
    String[] hex = unicode.split("\\\\u");
    for (int i = 1; i < hex.length; i++) {
        // 转换出每一个代码点
        int data = Integer.parseInt(hex[i], 16);
        string.append((char) data);
    }
    return string.toString();
}
```

点击运行，结果为：

```
aHR0cDovL2Rldi1zaWRlY2FyLmRvY21pcnJvci5jbi95b3VmaW5kaXQvaW5kZXguaHRtbA==
```

发现这又是一个编码后的串，需要再解。因为是 `==` 结尾，所以这是 base64。上网找个 base64 解码，得：

```
http://dev-sidecar.docmirror.cn/youfindit/index.html
```

接下来就是登录这个网站。我以为结束了，毫不费力嘛。打开网站傻眼了，除了文字之外，啥也没有。

![打开网站，一片空白](/writing/journey/journey01.png)

嗐，这又是开发者留下的一个谜，继续探寻。

既然页面看不出什么名堂，就直接进入开发者模式，看看有没有什么隐藏的内容藏在里面。

![开发者模式下的隐藏元素](/writing/journey/journey02.png)

果不其然，他偷偷藏了一张图片在页面里，看不见。我直接把图片下下来，发现是个二维码，但是这个二维码是透明的——这就是它能藏在页面里不被看到的原因。二维码的信息显示，它也是 base64 加密的，顺手解密看了看，发现他是用 Photoshop 处理的这个透明，不过这对解密没啥大用。

透明的二维码，用微信是扫不出来的。于是陷入迷茫，我也不会 PS，咋搞？

灵机一动，直接用图片查看器打开，再用截图工具截图，传到微信扫一扫。终于，谜底出现了。

![谜底揭晓](/writing/journey/journey04.png)

Yeah，IT 人的世界打通。

---

记于 2021 年夏末，南京邮电大学。
