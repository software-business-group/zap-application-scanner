
function authenticate(helper, paramsValues, credentials) {

    // Enable Rhino behavior, in case ZAP is running on Java 8 (which uses Nashorn)
    if (java.lang.System.getProperty("java.version").startsWith("1.8")) {
        load("nashorn:mozilla_compat.js");
    }

    // Imports
    importClass(org.parosproxy.paros.network.HttpRequestHeader);
    importClass(org.parosproxy.paros.network.HttpHeader);
    importClass(org.apache.commons.httpclient.URI);
    importClass(org.apache.commons.httpclient.params.HttpClientParams);
    importClass(java.util.regex.Pattern);

    var loginUri = new URI(paramsValues.get("loginUrl"), false);
    var formUri = new URI(paramsValues.get("formUrl"), false);

    var get = helper.prepareMessage();
    get.setRequestHeader(new HttpRequestHeader(HttpRequestHeader.GET, formUri, HttpHeader.HTTP10));
    helper.sendAndReceive(get);
    var inputValues = getInputValues(get.getResponseBody().toString());

    // Build the request body using the credentials values and the CAS values obtained from the first request
    var requestBody  = "_username="   + encodeURIComponent(credentials.getParam("username"));
    requestBody += "&_password="  + encodeURIComponent(credentials.getParam("password"));
    requestBody += "&_csrf_token=" + encodeURIComponent(inputValues["_csrf_token"]);
    requestBody += "&_submit=" + encodeURIComponent('Zaloguj');

    // Add any extra post data provided
    var extraPostData = paramsValues.get("extraPostData");
    if (extraPostData != null && !extraPostData.trim().isEmpty()) {
        requestBody += "&" + extraPostData.trim();
    }

    var post = helper.prepareMessage();
    post.setRequestHeader(new HttpRequestHeader(HttpRequestHeader.POST, loginUri, HttpHeader.HTTP10));
    post.setRequestBody(requestBody);
    helper.sendAndReceive(post);

    // Get the protected pages
    var protectedPagesSeparatedByComma = paramsValues.get("protectedPages");
    var protectedPages = protectedPagesSeparatedByComma.split(",");

    // Enable circular redirect
    var client = getHttpClientFromHelper(helper);
    client.getParams().setParameter(HttpClientParams.ALLOW_CIRCULAR_REDIRECTS, true);

    // Perform a GET request on the protected pages to avoid redirects during the scan
    for (var index in protectedPages) {
        var request = helper.prepareMessage();
        request.setRequestHeader(new HttpRequestHeader(HttpRequestHeader.GET, new URI(protectedPages[index], false), HttpHeader.HTTP10));
        helper.sendAndReceive(request, true);
    }

    // Disable circular redirect
    client.getParams().setParameter(HttpClientParams.ALLOW_CIRCULAR_REDIRECTS, false);

    return post;
}

function getInputValues(response){
    var result = {};

    var regex = "<input.*name=\"(_paswword|_username|_csrf_token)\".*value=\"([^\"]*)\"";
    var matcher = Pattern.compile(regex).matcher(response);
    while (matcher.find()) {
        result[matcher.group(1)] = matcher.group(2);
    }
    return result;
}

function getHttpClientFromHelper(helper) {
    var httpSenderField = helper.getClass().getDeclaredField("httpSender");
    httpSenderField.setAccessible(true);
    var httpSender = httpSenderField.get(helper);

    var clientField = httpSender.getClass().getDeclaredField("client");
    clientField.setAccessible(true);
    return clientField.get(httpSender);
}

function getRequiredParamsNames(){
    return ["formUrl", "loginUrl", "protectedPages"];
}

function getOptionalParamsNames(){
    return ["extraPostData"];
}

function getCredentialsParamsNames(){
    return ["username", "password"];
}