/////////////////////////////////////////////////////////////////////////////
//
//
//          ========>>>>>> HELPER FUNCTIONS SECTION
//
//
//
////////////////////////////////////////////////////////////////////////////

var global_job_var = undefined
var global_minmax_job_var = undefined
var global_obj = {}
global_obj["sale"] = {}
global_obj["rent"] = {}
var rent_value = 0
var sale_value = 0

function get_tab_url(){
    return new Promise((resolve, reject)=>{
        chrome.tabs.getSelected(null, function(tab){
            resolve(tab.url)
        });
    });
}

function makeHttpObject() {
    try {return new XMLHttpRequest();}
    catch (error) {}
    try {return new ActiveXObject("Msxml2.XMLHTTP");}
    catch (error) {}
    try {return new ActiveXObject("Microsoft.XMLHTTP");}
    catch (error) {}

    throw new Error("Could not create HTTP request object.");
}

function empty_storage(){
    chrome.storage.local.set({property_data : ""}, function(){ });
}

function save_data_in_storage(data){
    chrome.storage.local.set({property_data : data}, function(){ });
}

function show_data(){
    chrome.storage.local.get('property_data', function(data){
       console.log(data) 
    });
}

function get_request_flag(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('request_flag', function(flag){
            if(flag != null){
                resolve(flag)
            }
        });
    });
}
function get_postCode_flag(){ 

    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('postcode_flag', function(flag){
            if(flag != null){
                resolve(flag)
            }
        });
    });

}

function set_request_flag(flag) {

    chrome.storage.local.set({request_flag : flag}, function(){ });

}
function set_postCode_flag(flag) {

    chrome.storage.local.set({postcode_flag : flag}, function(){ });

} 

function set_collected_flag(flag) {

    chrome.storage.local.set({collected_flag : flag}, function(){ });

} 

function set_sale_value(value){
    chrome.storage.local.set({sale_value : value}, function(){ });
}

function set_rent_value(value){
    chrome.storage.local.set({rent_value : value}, function(){ });
}

function check_postcode_status(){
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('property_data', function(data){
            var i = 0;
            data = data['property_data']
            console.log("checking data")
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const element = data[key];
                    // console.log(element)
                    if( 'postcode' in element ){
                        i += 1
                    }
                }
            }
            // console.log(data)
            if( i >= 4){
                set_postCode_flag(true)
                flag = true
                resolve(flag)
            }else{
                flag = false
                resolve(flag)
            }

        });
    });
}

async function checking(){
    
    postcode_flag = await get_postCode_flag()
    var status = undefined
    // console.log(postcode_flag["postcode_flag"])
    if( postcode_flag["postcode_flag"] == false ){
        // Object postcodes has not been updated yet so call this functions
        status = await check_postcode_status()
        // status == True ===> Postcodes have been updated so call main_function for further operations 
        console.log('Status: ' + status)
        if( status == true){
            // console.log("Now going inside main")
            get_main_page()
            // Stop the JobDispatcher Function
            stop_postcode_job()   
        }

    }

}

function get_values(type){

    return new Promise( (resolve, reject)=>{
        chrome.storage.local.get(type, function(data){
            data = data[type]
            if(data != null){
                resolve(data)
            }
        });
    } );

}

async function checking_minMax(){
    // Completed Flag Will be true
    // It will check by comparing minMax value by the data set, like type of iteration keys
    // rent = await get_values("rent_value")
    // sale = await get_values("sale_value")
    // stop_minmax_job()

    chrome.storage.local.get('property_data', function(data){
        data = data["property_data"]
        var size = Object.keys(data).length;
        limit = size * 2
        // console.log(data)
        // console.log(global_obj)
        console.log("Limit is: " + limit)
        console.log('Rent Value: ' + rent_value)
        console.log('sale Value: ' + sale_value)
        // stop_minmax_job()
        if( (rent_value >= limit) && (sale_value >= limit) ){
            stop_minmax_job()
            
            for (const key in global_obj["rent"]) {
                if (data.hasOwnProperty(key)) {
                    data[key]["rent"] = global_obj["rent"][key]
                }
            }
            for (const key in global_obj["sale"]) {
                if (data.hasOwnProperty(key)) {
                    data[key]["sale"] = global_obj["sale"][key]
                }
            }
            
            // var i = 0
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const element = data[key];
                    console.log("Data key is: " + key)
                    if( (element["rent"]["r-1"]["min"] != 0) && (element["rent"]["r-1"]["max"] != 0)){
                        element["ROI"] = calculate_ROI(element["rent"]["r-1"]["min"],element["rent"]["r-1"]["max"],element["Price"] )
                        element["yeild"] = calculate_yield(element["rent"]["r-1"]["min"],element["rent"]["r-1"]["max"],element["Price"] )
                        element["final_rent"] = calculate_rent(element["rent"]["r-1"]["min"],element["rent"]["r-1"]["max"] )
                        // break;
                    }else if( ( element["rent"]["r-5"]["min"] != 0) && (element["rent"]["r-5"]["max"] != 0) ){
                        element["ROI"] = calculate_ROI(element["rent"]["r-5"]["min"],element["rent"]["r-5"]["max"],element["Price"] )
                        element["yeild"] = calculate_yield(element["rent"]["r-5"]["min"],element["rent"]["r-5"]["max"],element["Price"] )
                        element["final_rent"] = calculate_rent(element["rent"]["r-5"]["min"],element["rent"]["r-5"]["max"] )
                        // break;
                    }
                }
                
            }

            // console.log(data)
            // console.log(global_obj)
            console.log(data)
            empty_storage()
            save_data_in_storage(data)
            // show_data()
            set_collected_flag(true)
        }         

    });


}

function start_postcode_job(){
    global_job_var = setInterval(  function(){ 
        console.log("Checking...")
        checking() 
    } , 10000);
}

function start_minmax_job(){
    global_minmax_job_var = setInterval(  function(){ 
        console.log("Checking Min Max Values...")
        checking_minMax() 
    } , 5000);
}

function stop_postcode_job(){
    clearInterval(global_job_var);
}

function stop_minmax_job(){
    clearInterval(global_minmax_job_var);
}

function filter_and_save(){
    
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('property_data', function(data){
            
            data = data['property_data']
            console.log("checking data")
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const element = data[key];
                    // console.log(element)
                    if( !('postcode' in element) ){
                        delete data[key]
                    }else{

                        // Checking for bedrooms and property category in Name
                        index = element["Name"].search("bedroom")
                        if( index == -1 ){
                            delete data[key]
                        }else{
                            element["sale"] = {}
                            element["rent"] = {}
                            name = element["Name"]
                            name = name.replace(/\s+/g,' ').trim();
                            bedroom = name.split(" ")[0]
                            element["Name"] = name

                            if( (element["Name"].search("apartment")) >= 0 || (element["Name"].search("apartments")) >=0 ){
                                type = "flats"                                
                            }else{
                                type = "houses"
                            }

                            element["bedroom"] = bedroom
                            element["type"] = type
                        }
                    }
                }
            }
            empty_storage()
            save_data_in_storage(data)
            resolve("Ok")
        });
    });
}


function calculate_ROI(min_rent, max_rent, property_value){
    // Formula = (Income / Expenses) * 100
    // Income = gross payment rent (annual) - mortgage payment

    mortgage_rate = 5
    mortgage = get_mortgage(property_value)
    deposit = get_deposit(property_value)

    // console.log('Mortgage_Value is: ' + mortgage)
    // console.log('Deposit Value is: ' + deposit)

    annual_interest = get_annual_interest(mortgage, mortgage_rate)

    annual_income = get_annual_income(min_rent, max_rent)

    // console.log('Annual interest is: ' + annual_interest)
    // console.log('Annual Income is: ' + annual_income)

    income = annual_income - annual_interest

    roi = income / deposit

    // console.log('Final Income is: ' + income)
    // console.log('ROI Value is: ' + roi)
    roi = roi * 100
    roi = roi.toFixed(2)
    return roi
}

function calculate_yield(min, max, property_value){
    if(typeof(property_value) == 'string'){
        property_value = property_value.replace(/,/g, '')
        property_value = parseInt(property_value)
    }

    rent_income = calculate_rent(min, max)
    rent_income = rent_income * 12

    result = rent_income / property_value
    result = result * 100

    result = result.toFixed(2)

    return result
} 

function calculate_rent(min, max){

    sum = min + max
    return (sum / 2)

}


function get_mortgage(property_value){
    if(typeof(property_value) == 'string'){
        property_value = property_value.replace(/,/g, '')
        property_value = parseInt(property_value)
    }

    mortgage = property_value / 100
    mortgage = mortgage * 75

    return mortgage
}
function get_deposit(property_value){
    if(typeof(property_value) == 'string'){
        property_value = property_value.replace(/,/g, '')
        property_value = parseInt(property_value)
    }
    
    deposit = property_value / 100
    deposit = deposit * 25
    
    return deposit
}

function get_annual_interest(mortgage, mortgage_rate){
    if(typeof(mortgage) == 'string'){
        mortgage = mortgage.replace(/,/g, '')
        mortgage = parseInt(mortgage)
    }
    
    interest = mortgage / 100
    interest = interest * mortgage_rate
    
    return interest
}

function get_annual_income(min, max){
    sum = min + max
    sum = sum / 2

    return sum * 12

}


/////////////////////////////////////////////////////////////////////////////
//
//
//          ========>>>>>> END OF HELPER FUNCTIONS SECTION
//
//
//
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////
//
//
//
//              ======>  MAIN FUNCTION
//
//
//
/////////////////////////////////////////////////////////////////////////

async function get_main_page(){

    // First we will check if their is another request pending 
    // THis will help us in Controlling the number of requests 
    // Flag = request_flag
    //                ==> True = waiting for new requests
    //                ==> False = not accepting new requests until the previous one is completed
    //                            or Discard/Refresh btn is clicked  

    request_flag = await get_request_flag()
    console.log(request_flag["request_flag"])
    if( request_flag["request_flag"] == true){   //Start working on the accepted request
        
        set_request_flag(false);  //Lock the requests
        // Set flag to false so this will not acccept new requests

        url = await get_tab_url();
        console.log(url)
        var request = makeHttpObject();
        var htmlRes;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = function() {
            if (request.readyState == 4){
                htmlRes = request.responseText
                // console.log("HTML RESPONSE IS" + htmlRes)
                data = extract_main(htmlRes);
                if( data != -1 ){
                    // console.log(data)
                    // Simple filtered data set
                    data = filter_data(data)
                    save_data_in_storage(data)
                    // Now find the postcodes against the given addresses and get the new object
                    // new object will have post codes
                    get_object_with_postcode(data)  // this function will save the object in storage after getting the postcode
                    start_postcode_job()
                    // console.log(data)
                    // show_data()
                }
            }
        };

    } else if( request_flag["request_flag"] == false ){
        // Now here we know that we have a request to be completed
        // So We will add another flag here, which will check Weather the object is updated with PostCodes

        // Flag = postCode_flag
        //              ===> True = object has been updated with postcodes and ready for further opertaions
        //              ===> False = object has not been updated with postcodes 


        postcode_flag = await get_postCode_flag()
        if( postcode_flag["postcode_flag"] == true){
            stop_postcode_job()
            console.log("Working on object with postcodes")
            filter_status = await filter_and_save()
            show_data()
            // Now here we will find the 0.5 mile and 1 mile radius properties on zoopla against each postcode
            // Then we will save the min and max values for sales, rent propertis against each postcode
            // After All that we will calculate ROI/yeild/Investment

            get_zoopla_data("0.50")
            get_zoopla_data("1.00")

            start_minmax_job()   

        }else if( postcode_flag["postcode_flag"] == false){
            console.log("Waiting for updated object...")
            // Show progress
        }
    }
    // Now we have the object with Name, Address, Postcode, Price


}



/////////////////////////////////////////////////////////////////////////////
//
//
//          ===========>>>  END OF MAIN FUNCTION
//  
//  
////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////
//
//
//                  PART ONE 
//                      EXTRACTION OF MAIN PAGE
//                          GETTING ALL THE DATA IN A SINGLE OBJECT
//
//
//
//////////////////////////////////////////////////////////////////////////////////
 
// For list of properties in main page ' data-test="propertyCard    '
// For property titles ' class="propertyCard-title"  '
// For property address ' class="propertyCard-address" '  -> then <span> tag complete
// Get Price  class="propertyCard-priceValue"
// POST CODE AND GET OTHER DETAILS FOR ROI/YIELD/INTEREST
function extract_main(htmlResponse){
    if(htmlResponse != undefined){
        console.log("Started Extraction...");
        console.log(typeof(htmlResponse))
        var limit;
        limit = get_card_limit(htmlResponse)
        var obj = {}
        // Now we have the limit for the cards so we can make a loop easily
        for(let i = 0; i <= limit; i++) {
            // console.log("propertyCard-"+i)
            // Checking the index of propertyCard-#
            var index = htmlResponse.search('data-test="propertyCard-'+i+'"')
            // console.log(htmlResponse.length)
            propertyString = htmlResponse.substr(index, 10000)
            if( index < 1){
                console.log("Nothing found...")
            }else{
                obj["data_"+i] = {}
                // Now we will check the property details (Name, address, price)
                propertyName = get_property_name(propertyString)
                propertyAddress = get_property_address(propertyString)
                propertyPrice = get_property_price(propertyString)
                propertylink = get_property_link(propertyString)

                obj["data_"+i]["Name"] = propertyName
                obj["data_"+i]["Address"] = propertyAddress
                obj["data_"+i]["Price"] = propertyPrice
                obj["data_"+i]["link"] = propertylink
            }
        }
        return obj
    }else{
        console.log("Waiting for response...");
        return -1
    }

}

function get_card_limit(htmlResponse){
    var index = htmlResponse.lastIndexOf('data-test="propertyCard');
    if( index < 1){
        console.log("Nothing found...")
        return -1
    }else{
        // console.log("The last is: " + index);
        // Index has the starting index of data-test
        // Now adding 11 so we get starting index of propertyCard
        index = index + 10 
        // Now we will the get number of propertyCard
        substr = htmlResponse.substr(index, 20)
        num = extract_card_number(substr)
        // console.log("Limit of Property Cards: " + num)
        var limit = parseInt(num)
        // console.log(typeof(limit))
        return limit
    }

}

function extract_card_number(numString, index){

    // First check for the index of hypen " - "
    var hypenIndex = numString.search('-')
    hypenIndex += 1
    // Then find the last inverted comma to extract the number
    var invIndex = numString.lastIndexOf('"');
    invIndex = invIndex - hypenIndex
    // console.log(invIndex)
    limit = numString.substr(hypenIndex, invIndex);

    return limit
}

// For property titles ' class="propertyCard-title"  '
// For property address ' class="propertyCard-address" '  -> then <span> tag complete
function get_property_name(propertyString){
    var index = propertyString.search('class="propertyCard-title"')
    propertyString = propertyString.substr(index, 10000)
    // Finding ">" cause from here our Title will start
    var startIndex = propertyString.search('>')
    startIndex += 1
    // Then ending tag </
    var endIndex = propertyString.search('</')
    endIndex = endIndex - startIndex

    // console.log(propertyString.substr(startIndex, endIndex))
    return propertyString.substr(startIndex, endIndex)
}

function get_property_address(propertyString){
    var index = propertyString.search('class="propertyCard-address')
    propertyString = propertyString.substr(index, 10000)
    // console.log(propertyString)
    // Finding the <span> tag for starting
    var startIndex = propertyString.search('streetAddress')
    newstr = propertyString.substr(startIndex, 1000)

    var ind = newstr.search('content')
    ind += 9
    startIndex = startIndex + ind
    // console.log(propertyString.substr(startIndex, 100))
    newstr = propertyString.substr(startIndex, 1000)
    // console.log(newstr)
    var endIndex = newstr.search('"')
    // endIndex = endIndex - startIndex
    // console.log(endIndex)

    return propertyString.substr(startIndex, endIndex)
}

function get_property_price(propertyString){
    var index = propertyString.search('class="propertyCard-priceValue"')
    newstr = propertyString.substr(index, 450)
    // finding '>'
    var startIndex = newstr.search('>')
    startIndex +=2
    // Then finding '<'
    // console.log(newstr)
    var endIndex = newstr.search('<')
    endIndex = endIndex - startIndex
    // console.log(endIndex)
    return newstr.substr(startIndex, endIndex)
}

function get_property_link(propertyString){
    var index = propertyString.search('class="propertyCard-link"')
    newstr = propertyString.substr(index, 1000)
    // finding href=
    var startIndex = newstr.search('href="')
    startIndex +=  6
    // Then finding ">
    var endIndex = newstr.search('.html"')
    endIndex += 5
    endIndex = endIndex - startIndex

    str = newstr.substr(startIndex, endIndex)
    str = "https://www.rightmove.co.uk" + str
    return str
}

// THIS FUNCTION IF FOR THE FILTERTAION OF THE DATA
function filter_data(data){

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const element = data[key];
            
            if( element["Name"] == "" || element["Name"] == " "){
                delete data[key]
            }

        }
    }
    return data
}
//////////////////////////////////////////////////////////////////////
//              
//              
//              END OF THE SECTION
//          
//              
//////////////////////////////////////////////////////////////////////


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 

/////////////////////////////////////////////////////////////////////////////////////
//            
//
//      SECTION TWO ( 2 )
//          REQUESTING FOR POSTCODES AGAINST GIVEN ADDRESSES
//              
//
//
//////////////////////////////////////////////////////////////////////////////////////////////////

function get_object_with_postcode(data){

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const element = data[key];
            get_postcode(key, element["Address"])
            // console.log(key)
        }
    }

    return data

}


function get_postcode(key, address){
    
    const filtered_address = filter_address(address)
    // "https://api.opencagedata.com/geocode/v1/json?q=PLACENAME&key=3816ba3dcfdb4b1dad0a030b6226977f"
    const api_key = "3816ba3dcfdb4b1dad0a030b6226977f"
    const base_url = "https://api.opencagedata.com/geocode/v1/json?q="
    var url = base_url + filtered_address +"&key=" + api_key
    const final_url = encodeURI(url)

    // console.log(final_url)
    // console.log(key)

    getJSON(final_url, key, function(err, key, data) {
        if (err !== null) {
            console.log(data)
        } else {
            if( data["results"].length < 1 ){
                console.log("data have to be deleted")
            }else{
                components = data["results"][0]["components"]

                // Storing postcodes in element
                chrome.storage.local.get('property_data', function(data){
                    if(data != null){
                        data = data['property_data']
                        for (const datakey in data) {
                            if (datakey == key) {
                                const element = data[datakey];
                                element["postcode"] = components["postcode"]
                                // console.log(element)
                            }
                        }
                        // console.log(data)
                        empty_storage()
                        save_data_in_storage(data)
                    }
                    
                });

            }
            
        }
    });

}


function filter_address(address){

    strings = address.split(',')
    string_len = strings.length
    if(string_len >= 4){
        // console.log("Data object is greater and equal to 4")
        new_address = strings[string_len - 3] + strings[string_len - 2] + strings[string_len - 1]
        // console.log(new_address)
        return new_address
    }
    return address
}



var getJSON = function(url, key, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, key, xhr.response);
      } else {
        callback(status, key, xhr.response);
      }
    };

    xhr.send();
};

// get_postcode("data_1", "28 Gillygate, York, YO31 7EQ")




// chrome.storage.local.get('property_data', function(data){
//     if(data != null){
//         // console.log(components["postcode"])
//         // postCode = components["postcode"]
//         // if( postCode != undefined ){
//         // key = "data_0"
//         // data["property_data"][key]["postcode"] = 1234
//         // save_data_in_storage(data)
//         console.log("CHECKING DATA ")
//         console.log(data)
//         // }
//         // console.log(key)
//     }
    
// })

// Sample urls
// For sale
// https://www.zoopla.co.uk/search/?q=YO30%207AH&property_type=houses&beds_min=3&beds_max=3&category=residential&section=for-sale&radius=0.50

// For rent
// https://www.zoopla.co.uk/search/?q=YO30%207AH&property_type=houses&beds_min=3&beds_max=3&category=residential&section=to-rent&radius=0.50

////////////////////////////////////////////////////////////////////////////////
//
//
//          SECTION 3
//              =======>>>>>>>   FETCHING DATA FROM ZOOPLA
//
//
//
//
////////////////////////////////////////////////////////////////////////////////

function make_rent_url(bedroom, property_type, postcode, radius){
    const base_url = "https://www.zoopla.co.uk/search/?q="
    const type = "&property_type=" + property_type
    const beds = "&beds_min=" + bedroom + "&beds_max=" + bedroom
    const other_info = "&category=residential&section=to-rent&radius=" + radius
    postcode = postcode.split(" ")[0]
    postcode = encodeURI(postcode)
    url = base_url + postcode + type + beds + other_info

    const final_url = encodeURI(url)

    // console.log(final_url)
    return final_url
}


function make_sale_url(bedroom, property_type, postcode, radius){

    const base_url = "https://www.zoopla.co.uk/search/?q="
    const type = "&property_type=" + property_type
    const beds = "&beds_min=" + bedroom + "&beds_max=" + bedroom
    const other_info = "&category=residential&section=for-sale&radius=" + radius
    postcode = postcode.split(" ")[0]
    postcode = encodeURI(postcode)
    url = base_url + postcode + type + beds + other_info

    const final_url = encodeURI(url)

    // console.log(final_url)
    return final_url
}


// make_sale_url(3, "houses", "YO30", "0.50")
// make_rent_url(3, "houses", "YO30", "0.50")

// In this function we will get the min, max price for sale, rent properties using postcode
function get_zoopla_data(radius){

    get_sale_data(radius)
    get_rent_data(radius)

}

function get_sale_data(radius){

    chrome.storage.local.get('property_data', function(data){
        var i = 0
        if( data != null ){

            data = data["property_data"]
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    // if( i < 3 ){
                       const element = data[key];
                        // console.log(key)
                        const url_to_use = make_sale_url(element["bedroom"], element["type"], element["postcode"], radius)
                        fetch_sale_data(key, url_to_use, radius)
                    // console.log("FOR SALE")
                    // console.log("URL is: " + url_to_use)
                    // }
                    // i +=1 
                }
            }

        }
        
    
    });

}

function get_rent_data(radius){
    chrome.storage.local.get('property_data', function(data){
        var i = 0;
        if( data != null ){

            data = data["property_data"]
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    // if(i < 3){
                        const element = data[key];
                        // console.log(key)
                        const url_to_use = make_rent_url(element["bedroom"], element["type"], element["postcode"], radius)
                        fetch_rent_data(key, url_to_use, radius)
                    // console.log("FOR RENT")
                    // console.log("URL is: " + url_to_use)
                    // }
                    // i += 1
                }
            }

        }
        
    
    });
}

function fetch_sale_data(key, url, radius){

    var request = makeHttpObject();
    var htmlRes;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = function() {
        if (request.readyState == 4){
            htmlRes = request.responseText
            parse_and_save_sale_data(key, htmlRes, radius)
        }
    }

}


function fetch_rent_data(key, url, radius){
    
    var request = makeHttpObject();
    var htmlRes;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = function() {
        if (request.readyState == 4){
            htmlRes = request.responseText
            parse_and_save_rent_data(key, htmlRes, radius)
        }
    }

}


// class="listing-results-price text-price"
function parse_and_save_sale_data(key, htmlRes, radius){
    // var prices = []
    index = htmlRes.search('class="listing-results-price text-price"')
    
    if( index != -1 ){
        // Get all the data for prices maximum 10 and if less then 10 break the loop
        var newstr = htmlRes
        var prices = []
        var i = 0;
        var regexp = /class="listing-results-price text-price"/g;
        var match, matches = [];

        while ((match = regexp.exec(newstr)) != null) {
            matches.push(match.index);
        }

        limit = matches.length
        if( limit > 10){ limit = 10 }

        while(i < limit ){
            prices.push(get_sale_price(newstr.substr(matches[i], 1000)))
            i +=1
        }
        // console.log(i)
        min = find_min(prices)
        max = find_max(prices)
        // save in storage
        save_sale_storage(key, min, max, radius)

    }else{
        // Save null to min and max data attribute
        save_sale_storage(key, 0, 0, radius)
    }

    //console.log(prices)
}


function parse_and_save_rent_data(key, htmlRes, radius){
    index = htmlRes.search('class="listing-results-price text-price"')
    
    if( index != -1 ){
        // Get all the data for prices maximum 10 and if less then 10 break the loop
        var newstr = htmlRes
        var prices = []
        var i = 0;
        var regexp = /class="listing-results-price text-price"/g;
        var match, matches = [];

        while ((match = regexp.exec(newstr)) != null) {
            matches.push(match.index);
        }

        limit = matches.length
        if( limit > 10){ limit = 10 }

        while(i < limit ){
            prices.push(get_rent_price(newstr.substr(matches[i], 1000)))
            i +=1
        }
        // console.log(i)
        min = find_min(prices)
        max = find_max(prices)
        // save in storage
        save_rent_storage(key, min, max, radius)

    }else{
        // Save null to min and max data attribute
        save_rent_storage(key, 0, 0, radius)
    }

}


function get_sale_price(newstr){
    // console.log(newstr)
    // Find >
    startIndex = newstr.search('&pound;')
    startIndex += 7
    // Then find </a>
    endIndex = newstr.search('<')
    endIndex = endIndex - startIndex
    // Then filter and store
    price = newstr.substr(startIndex, endIndex)
    // price = price.replace(/\u00A3/g, '')
    price = price.replace(/\s+/g,'').trim()
    price = price.replace(/,/g, '')
    var parsed = parseInt(price)
    if (isNaN(parsed)) { return 0 }
    return parsed;

}


function get_rent_price(newstr){
    // console.log(newstr)
    // Find >
    startIndex = newstr.search('&pound;')
    startIndex += 7
    // Then find </a>
    endIndex = newstr.search('pcm')
    endIndex = endIndex - startIndex
    // console.log(endIndex)
    // console.log(newstr)
    // Then filter and store
    price = newstr.substr(startIndex, endIndex)
    // price = price.replace(/\u00A3/g, '')
    price = price.replace(/\s+/g,'').trim()
    price = price.replace(/,/g, '')
    var parsed = parseInt(price)
    // console.log(parsed)
    if (isNaN(parsed)) { return 0 }
    return parsed;
    
}

function find_min(prices){
    return Math.min.apply(Math, prices)
}


function find_max(prices){
    return Math.max.apply(Math, prices)
}

// global_obj["sale"] = {}
// global_obj["rent"] = {}

function save_sale_storage(key, min, max, radius){
    if( global_obj["sale"][key] == undefined){
        global_obj["sale"][key] = {}
    }
    if( radius == "0.50"){
        global_obj["sale"][key]["r-5"] = {}
        global_obj["sale"][key]["r-5"]["min"] = min
        global_obj["sale"][key]["r-5"]["max"] = max
    }else{
        global_obj["sale"][key]["r-1"] = {}
        global_obj["sale"][key]["r-1"]["min"] = min
        global_obj["sale"][key]["r-1"]["max"] = max
    }
    // update_value('sale_value')
    sale_value += 1
    // console.log(sale_value)
}

function save_rent_storage(key, min, max, radius){

    if( global_obj["rent"][key] == undefined ){
        global_obj["rent"][key] = {}
    }

    if( radius == "0.50"){
        global_obj["rent"][key]["r-5"] = {}
        global_obj["rent"][key]["r-5"]["min"] = min
        global_obj["rent"][key]["r-5"]["max"] = max
    }else{
        global_obj["rent"][key]["r-1"] = {}
        global_obj["rent"][key]["r-1"]["min"] = min
        global_obj["rent"][key]["r-1"]["max"] = max
    }
    // update_value('rent_value')
    rent_value += 1
    // console.log(rent_value)
}


function update_value(type){
    chrome.storage.local.get(type, function(data){
        data = data[type]
        data += 1
        if( type == 'sale_value'){
            set_sale_value(data)
        }else{
            set_rent_value(data)
        }
    });
}

////////////////////////////////////////////////////////////////////////
//
//
//
//          ========>>>>>>>> SETTING UP DEFAULT VALUES
            set_postCode_flag(false)
            set_request_flag(true)
            set_sale_value(0)
            set_rent_value(0)
            set_collected_flag(false)
//
//
//
////////////////////////////////////////////////////////////////////////
// show_data()