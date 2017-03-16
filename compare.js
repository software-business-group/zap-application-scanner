var jsonfile = require('jsonfile'),
    config = require('config');

var args = process.argv.slice(2),
    application = args[0];

var results_one, results_two, diff,
    file_one = __dirname + '/tmp/results-one.json',
    file_two = __dirname + '/tmp/results-two.json',
    out_file = __dirname + '/results/results-from-' + new Date()+ '.json',
    parameters = config.get(application);

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

           var elem_clean_url = elem.url.replace(new RegExp("[0-9]", "g"), "X");

           obj2.forEach(function(elem2){
               var elem2_clean_url = elem2.url.replace(new RegExp("[0-9]", "g"), "X");

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