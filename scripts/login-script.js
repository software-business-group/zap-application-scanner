
function authenticate(helper, paramsValues) {

    // Enable Rhino behavior, in case ZAP is running on Java 8 (which uses Nashorn)
    if (java.lang.System.getProperty("java.version").startsWith("1.8")) {
        load("nashorn:mozilla_compat.js");
    }

    // Imports
    importClass(org.parosproxy.paros.network.HttpRequestHeader);
    importClass(org.parosproxy.paros.network.HttpHeader);
    importClass(org.apache.commons.httpclient.URI);
    importClass(java.util.regex.Pattern);

    var loginUri = new URI(paramsValues.get("loginUrl"), false),
        formUri = new URI(paramsValues.get("formUrl"), false),
        retrievedFormValues = paramsValues.get("retrievedFormValues"),
        loginData = paramsValues.get("loginData"),
        get = helper.prepareMessage(),
        requestBodyArray = [],
        loginDataArray = [],
        inputValues, post, responseBody, requestBody;

    get.setRequestHeader(new HttpRequestHeader(HttpRequestHeader.GET, formUri, HttpHeader.HTTP10));
    helper.sendAndReceive(get);
    responseBody = get.getResponseBody().toString();


    if(retrievedFormValues.length && !retrievedFormValues.trim().isEmpty()){
        retrievedFormValues = retrievedFormValues.trim().split(',');
        inputValues = getResponseInputs(responseBody, retrievedFormValues);
        for(var i = 0; i < retrievedFormValues.length; i++){
            requestBodyArray.push(retrievedFormValues[i] + "=" + inputValues[retrievedFormValues[i]])
        }
    }
    if(loginData.length && !loginData.trim().isEmpty()){
        loginDataArray = loginData.trim().split(',');
        for(var i = 0; i < retrievedFormValues.length; i++){
            requestBodyArray.push(loginDataArray[i]);
        }
    }

    requestBody = requestBodyArray.join('&');

    post = helper.prepareMessage();
    post.setRequestHeader(new HttpRequestHeader(HttpRequestHeader.POST, loginUri, HttpHeader.HTTP10));
    post.setRequestBody(requestBody);
    helper.sendAndReceive(post);
    return post;
}

function getResponseInputs(response, inputs_array){
    var result = {};

    var regex = "<input.*name=\"(" + inputs_array.join('|') + ")\"[^>]*\n?value=\"([^\"]*)\"";
    var matcher = Pattern.compile(regex).matcher(response);
    while (matcher.find()) {
        result[matcher.group(1)] = matcher.group(2);
    }
    return result;
}

function getRequiredParamsNames(){
    return ["formUrl", "loginUrl", "loginData"];
}

function getOptionalParamsNames(){
    return ["retrievedFormValues"];
}

function getCredentialsParamsNames(){
    return ["username", "password"];
}