var conf = require('config'),
    jsonfile = require('jsonfile'),
    ZapClient = require('zaproxy'),
    ProgressBar = require('progress');

var args = process.argv.slice(2),
    application = args[0],
    target_domain = 'http://' + args[1],
    check_number = args[2],
    parameters = conf.get(application),
    options = { proxy: parameters.proxy_url + ':' + parameters.proxy_port },
    zaproxy = new ZapClient(options),
    target_full_url = target_domain + parameters.target_url,
    login_script_path = __dirname + '/scripts/' + parameters.login_script + '.js',
    login_script_description = 'Script to login',
    authentication_method = 'scriptBasedAuthentication',
    context_name = Math.random(),
    logged_in_indicator_regex = '\\Q' + parameters.logged_in_indicator + '\\E.*',
    out_file = __dirname + '/tmp/results-' + check_number + '.json',
    auth_config = 'username=' + encodeURIComponent(parameters.username) + '&password=' + encodeURIComponent(parameters.password),
    script_based_config = "scriptName=" + encodeURIComponent(parameters.login_script);

script_based_config += "&loginUrl=" + encodeURIComponent(target_full_url + parameters.login_handler);
script_based_config += "&formUrl=" + encodeURIComponent(target_full_url + parameters.login_form);
script_based_config += "&submitValue=" + encodeURIComponent(parameters.submit_value);
script_based_config += "&protectedPages=" + encodeURIComponent(target_full_url + parameters.protected_url);

run();


function run(){
    createContext(function(context_id){
        loadRequiredScripts(function(){
            setAuthentication(context_id, function(context_id){
                createUser(context_id, function(context_id, user_id){
                    runScan(context_id, user_id, saveScanResults);
                });
            });
        });
    });
}

function logScanProgress(scan_id, callback, progress_bar, progress){
    var new_progress;
    progress_bar = progress_bar || new ProgressBar('Scanning progress [:bar] :percent already took: :elapsed s', {
        total: 100,
        complete: '=',
        incomplete: ' ',
        width: 100
    });

    if(progress != 100){
        zaproxy.spider.status(scan_id, function(err, resp){
            if(err) console.log(err);

            setTimeout(function(){
                new_progress = parseInt(resp.status);
                progress_bar.tick(new_progress - progress);
                logScanProgress(scan_id, callback, progress_bar, new_progress);
            }, 7000);
        })
    }
    else{
        callback();
    }
}

function runScan(context_id, user_id, callback){
    zaproxy.spider.setOptionMaxDepth(parameters.depth, function(err, resp){
        if(err) console.log(err);
        zaproxy.spider.scanAsUser(target_full_url, context_id, user_id, '', function(err, resp){
            if(err) console.log(err);

            logScanProgress(resp.scanAsUser, function(){
                callback(resp.scanAsUser);
            });
        });
    });
}

function saveScanResults(scan_id){
    zaproxy.spider.fullResults(scan_id, function(err, resp){
        if(err) console.log(err);
        jsonfile.writeFileSync(out_file, resp.fullResults[0].urlsInScope);
    });
}

function loadRequiredScripts(callback){
    console.log('Loading script '+parameters.login_script+' into zap');

    zaproxy.script.listScripts(function(err, resp){
        checkIfContainsScript(resp.listScripts, parameters.login_script, function(found){
            if(!found){
                zaproxy.script.load(parameters.login_script, 'authentication', 'Oracle Nashorn', login_script_path, login_script_description, function(err, resp) {
                    if (err) console.log(err);
                    callback();
                });
            }
            else{
                callback();
            }
        });
    });
}

function checkIfContainsScript(scripts, script_name, callback){
    var found = false;
    for(var i = 0; i < scripts.length; i++) {
        if (scripts[i].name == script_name) {
            found = true;
            break;
        }
    }
    callback(found);
}



function createContext(callback) {
    console.log('Creating new context with name ' + context_name);

    zaproxy.context.newContext(context_name, function (err, resp) {
        var context_id = resp.contextId;

        console.log('Adding target ' + context_name + ' to context');
        zaproxy.context.includeInContext(context_name, '\\Q' + target_domain + '/\\E.*', function (err, resp) {
            if (err) console.log(err);
            callback(context_id);
        });
    });
}

function setAuthentication(context_id, callback){
    console.log('Setting ' + authentication_method + ' method');

    zaproxy.authentication.setAuthenticationMethod(context_id, authentication_method, script_based_config , function(err, resp) {
        if (err) console.log(err);

        console.log('Setting logged in indicator');
        zaproxy.authentication.setLoggedInIndicator(context_id, logged_in_indicator_regex, function (err, resp) {
            if (err) console.log(err);
            callback(context_id);
        });
    });
}

function createUser(context_id, callback) {
    console.log('Adding user to created context with username ' + parameters.username);

    zaproxy.users.newUser(context_id, parameters.username, function (err, resp) {
        if (err) console.log(err);
        var user_id = resp.userId;

        console.log('Setting user authentication credentials');

        zaproxy.users.setAuthenticationCredentials(context_id, user_id, auth_config, function (err, resp) {
            if (err) console.log(err);

            console.log('Enabling user');

            zaproxy.users.setUserEnabled(context_id, user_id, 'True', function (err, resp) {
                if (err) console.log(err);
                callback(context_id, user_id);
            });
        });
    });
}