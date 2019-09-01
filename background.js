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
            if( data != -1){
                // console.log(data)
                // Simple filtered data set
                data = filter_data(data)
                save_data_in_storage(data)
                // Now find the postcodes against the given addresses and get the new object
                // new object will have post codes
                data = get_object_with_postcode(data)
                // console.log(data)
                show_data()
            }
        }
    };

}

function show_data(){
    chrome.storage.local.get('property_data', function(data){
       console.log(data) 
    });
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

                obj["data_"+i]["Name"] = propertyName
                obj["data_"+i]["Address"] = propertyAddress
                obj["data_"+i]["Price"] = propertyPrice

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
                                console.log(element)
                            }
                        }
                        console.log(data)
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
    
// });

