import shutil, json, base64, os, traceback
from urllib import parse
try :
    parameters=parse.parse_qs(os.environ.get('QUERY_STRING'))
    for k in parameters:
        parameters[k]=parameters[k][0]
        print( f"""{k}={parameters[k]}""")
    command=parameters['command']
    if command=='store':
        os.makedirs(os.path.join('../tmp',parameters['directory']),exist_ok=True)
        with open(os.path.join('../tmp',parameters['directory'],parameters['piece']),'w') as f:
            f.write(parameters['data'])
        pass
    if command=='save':
        n=int(parameters['n'])
        data=''
        filename='images.json'
        directory=os.path.join('../tmp',parameters['directory'])
        print(directory)
        for i in range(n) :
            with open(os.path.join(directory,str(i))) as f:
                data=data+f.read()
        with open(os.path.join(directory,'all'),'w') as f:
            f.write(data)
        json.dump(json.loads(base64.b64decode(data).decode('utf-8')),open(os.path.join('../tmp',filename),'w'), indent=2)
        shutil.rmtree(directory)
        pass
except Exception as e:
    print(e)
    traceback.print_exception(e)
    