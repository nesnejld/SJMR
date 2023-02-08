from functools import reduce
import requests
from html.parser import HTMLParser
import json
import os
import copy
import re
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
# logger.propagate=False
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'))
logger.addHandler(handler)
filehandler = logging.FileHandler("sjmr.log")
filehandler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(filehandler)

queue=[]

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.list = False
        self.current = None
        self.root = None
    
    def tojson(self):
        out = copy.copy(self.root)

        def removeparent(e):
            if e is None or 'parent' not in e:
                return
            del e['parent']
            for c in e['children']:
                removeparent(c)
        removeparent(out)
        return json.dumps(out, indent=2)

    def handle_starttag(self, tag, attrs):
        # print("Encountered a start tag:", tag)
        if tag == 'body':
            self.current = {'tag': tag, 'attrs': attrs,
                            'children': [], 'parent': None, 'data': []}
            self.list = True
            self.root = self.current
        # if tag=='div' and reduce(lambda a,v: a or v[0]=='id' and v[1]=='content', attrs, False):
        #     self.current={'tag':tag, 'attrs':attrs, 'children': [], 'parent':None, 'data': []}
        #     self.list=True
        #     self.root=self.current
        elif self.list:
            e = {'tag': tag, 'attrs': attrs, 'children': [],
                 'parent': self.current, 'data': []}
            self.current['children'].append(e)
            self.current = e
        if tag == 'img':
            pass

    def handle_endtag(self, tag):
        # print("Encountered an end tag :", tag)
        if self.list:
            self.current = self.current['parent']
            if self.current is None:
                self.list = False

    def handle_data(self, data):
        # print("Encountered some data  :", data)
        if self.list and len(data.strip()) > 0:
            self.current['data'].append(data.strip())

    def getimages(self, e=None):
        if e is None:
            e = self.root
        if e is None:
            return
        if e['tag'] == 'img':
            url = getattr(e, 'src')
            geturl(url)
            pass
        else:
            for c in e['children']:
                self.getimages(c)
        pass

    def gethrefs(self, e=None):
        if e is None:
            e = self.root
        if e is None:
          return      
        if e['tag'] == 'a':
            # printelement(e)
            url = getattr(e, 'href')
            if url is None:
                return
            url, path, file = pathfromurl(url)
            if path is not None and file is not None and not os.path.exists(f'{path}/{file}'):
                logger.info(url) 
                if False:
                    text = geturl(url)
                    binary = isbinary(file)
                    if not binary:
                        parser = MyHTMLParser()
                        parser.feed(text)
                        with open(f"""{path}/{file}.json""", "w") as f:
                            f.write(parser.tojson())
                        parser.getimages()
                        parser.gethrefs()
                else:
                    queue.append(url)
            pass
        else:
            for c in e['children']:
                self.gethrefs(c)

        pass

    def printarticles(self, e=None):
        if e is None:
            e = self.root
        if e['tag'] == 'article':
            if getattr(e, 'class') == 'post error404 not-found':
                raise Exception(getattr(e, 'class'))
            header = reduce(
                lambda a, v: v if v['tag'] == 'header' else a, e['children'], None)
            printelement(header)
            footer = reduce(
                lambda a, v: v if v['tag'] == 'footer' else a, e['children'], None)
            printelement(footer)
            body = reduce(
                lambda a, v: v if v['tag'] == 'div' else a, e['children'], None)
            printelement(body)
            if False:
                ee = getpath(header, 'h2.a')
                if len(ee['data']) > 0:
                    print(ee['data'][0])
                ee = getpath(header, 'div.a')
                a = getattr(ee, 'href')
                if a is not None:
                    print(a)
                ee = getpath(header, 'div.a.time')
                a = getattr(ee, 'datetime')
                if a is not None:
                    print(a)
            pass
        else:
            for c in e['children']:
                self.printarticles(c)

        pass

    def printbody(self, e=None):
        if e is None:
            e = self.root
        if e['tag'] == 'body':
            printelement(e)
        else:
            for c in e['children']:
                self.printbody(c)

def printelement(e, prefix=None):
    if e is None:
        return
    prefix = f"""{prefix}.{e['tag']}""" if prefix is not None else e['tag']
    logger.info(f"""{prefix}""")
    for a in e['attrs']:
        logger.info(f"""{prefix}[{a[0]}]={a[1]}""")
    for i, d in enumerate(e['data']):
        logger.info(f"""{prefix}[{i}]={d}""")
    for c in e['children']:
        printelement(c, prefix)


def getattr(e, aa):
    if e is None:
        return None
    return reduce(lambda a, v: v[1] if v[0] == aa else a, e['attrs'], None)


def getchild(e, aa):
    if e is None:
        return None
    return reduce(lambda a, v: v if v['tag'] == aa else a, e['children'], None)


def getpath(e, pathexpr):
    if e is None:
        return None
    parts = pathexpr.split('.', 1)
    head = parts[0]
    parts = parts[1] if len(parts) > 1 else None
    ee = getchild(e, head)
    if ee is None:
        return None
    if parts is not None:
        return getpath(ee, parts)
    else:
        return ee
    pass


site = 'www.sjmr.club'


def pathfromurl(url):
    if url.endswith('/'):
        url = url[0:-1]
    if url.find(':') == -1:
        url = f"""http://{site}{url}"""
    protocol = url[0:url.index(':')]
    if protocol!='http' and protocol!='https':
        return None,None,None
    if not url.startswith(f"{protocol}://{site}"):
        return None, None, None
    path = f'content/{url[len(f"{protocol}://{site}"):]}'
    if path == 'content/':
        path = 'content/root'
    i = path.rindex('/')
    file = f"""{path[i+1:]}.html""" if path[i +
                                            1:].find('.') == -1 else path[i+1:]
    path = path[0:i]
    return (url, path, file)


def isbinary(file):
    return file.lower().endswith('.jpg') or file.lower().endswith(
        '.png') or file.lower().endswith('.jpeg') or file.lower().endswith('.pdf')


def geturl(url):
    url, path, file = pathfromurl(url)
    if path is None or file is None:
        return None
    binary = isbinary(file)
    if os.path.exists(f'{path}/{file}'):
        with open(f'{path}/{file}', 'r'+('b' if binary else '')) as f:
            text = f.read()
        return text
    os.makedirs(f'{path}', exist_ok=True)
    logger.info(f"Getting url: {url}")
    r = requests.get(url)
    text = r.text
    if not binary:
        # fixup bad image tags
        text = re.sub('"\s*</a', '"/> </a', text)

    with open(f'{path}/{file}', 'w'+('b' if binary else '')) as f:
        f.write(text if not binary else r.content)
    return text

if __name__ == '__main__':    
    parser = MyHTMLParser()
    parser.feed(geturl(f"""http://{site}/"""))
    with open('content/root.json', 'w') as f:
        f.write(parser.tojson())
    parser.printbody()
    parser.getimages()
    parser.gethrefs()
    path = f'page/'
    page = 0
    while True:
        try:
            parser = MyHTMLParser()
            parser.feed(geturl(f'https://www.sjmr.club/{path}{page}/'))
            parser.printarticles()
            parser.getimages()
            page += 1
        except Exception as e:
            break
pass
