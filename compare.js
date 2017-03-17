var jsonfile = require('jsonfile'),
    config = require('config');

var args = process.argv.slice(2),
    application = args[0];

var results_one, results_two, diff,
    file_one = __dirname + '/tmp/results-one.json',
    file_two = __dirname + '/tmp/results-two.json',
    out_file = __dirname + '/results/results-from-' + new Date()+ '.json',
    parameters = config.get(application),
    possible_tokens = ['csrf', 'token', 'csrf_token'];

results_one = jsonfile.readFileSync(file_one);
results_two = jsonfile.readFileSync(file_two);
diff = getDiff(results_two, results_one);

if(diff.length){
    jsonfile.writeFile(out_file, diff, function(){
        process.exit(1);
    });
}

function getDiff(obj1, obj2){
    var diff = [],
        same;
    obj1.forEach(function(elem){
       same = false;

       if(parameters.ignored_codes.indexOf(elem.statusCode) == -1){

           var elem_clean_url = cleanUrl(elem.url);

           obj2.forEach(function(elem2){
               var elem2_clean_url = cleanUrl(elem2.url);

               if( elem_clean_url == elem2_clean_url
                   && elem.method == elem2.method
                   && elem.statusCode == elem2.statusCode)
               {
                   same = true;
               }
           });
           if(!same){
               diff.push(elem);
           }
       }
    });
    return diff;
}

function cleanUrl(url){
    url = decodeURIComponent(url);
    url = url.replace(/\d+/g, "X");
    possible_tokens.forEach(function(token){
        url = replaceUrlParam(url, token, "X");
    });
    return url;
}

function replaceUrlParam(url, paramName, paramValue){
    if(paramValue == null)
        paramValue = '';
    var pattern = new RegExp('\\b('+paramName+'=).*?(&|$)')
    if(url.search(pattern)>=0){
        return url.replace(pattern,'$1' + paramValue + '$2');
    }
    return url + (url.indexOf('?')>0 ? '&' : '?') + paramName + '=' + paramValue
}