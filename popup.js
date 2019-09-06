var discard_btn = document.getElementById('discard_btn')

var timer = undefined

var error_section = document.getElementById('error_section')
var data_section = document.getElementById('data_section')
var loader = document.getElementById('loader')

hide_all()


discard_btn.addEventListener('click', function(){
    // Setting All flags to their default values
    hide_all()
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        
        backgroundPage.set_postCode_flag(false)
        backgroundPage.set_request_flag(true)
        backgroundPage.set_sale_value(0)
        backgroundPage.set_rent_value(0)
        backgroundPage.set_collected_flag(false)
        backgroundPage.empty_storage()

    });

});

function start_job(){
    timer = setInterval(  function(){ 
        console.log("Checking Min Max Values...")
        main() 
    } , 10000);
}

function stop_job(){
    clearInterval(timer);
}

async function main(){
    var collected_flag = await get_collected_flag()
    var request_flag = await get_request_flag()

    var tab_url = await get_tab_url()

    if( (tab_url.search("rightmove.co.uk") != -1) && (tab_url.search("property-for-sale/find") != -1) ){
        if( request_flag == true){
            chrome.runtime.getBackgroundPage(function(backgroundPage){
                backgroundPage.get_main_page()
            });         
            start_job()   
        }
    
        if(collected_flag == false){
            // show loading
            show_loading()
        }else{
            // Show data
            show_property_data()
            stop_job()
        }
    }
    else{
        show_error()
    }

}


function get_tab_url(){
    return new Promise((resolve, reject)=>{
        chrome.tabs.getSelected(null, function(tab){
            resolve(tab.url)
        });
    });
}

function get_request_flag(){
    return new Promise( (resolve, reject)=>{
        chrome.storage.local.get('request_flag', function(flag){
            if(flag != null){
                flag = flag['request_flag']
                resolve(flag)
            }
        });
        
    });
}

function get_collected_flag(){
    return new Promise( (resolve, reject)=>{
        chrome.storage.local.get('collected_flag', function(flag){
            if(flag != null){
                flag = flag['collected_flag']
                resolve(flag)
            }
        });
        
    });
}


function show_error(){
    error_section.style.display = 'block'
}

function show_loading(){
    loader.style.display = 'block'
    document.getElementById("load_head").innerHTML = "Please Wait!"

}

function show_property_data(filter){
    hide_all()
    data_section.style.display = 'block'
    document.getElementById("load_head").innerHTML = ""
    chrome.storage.local.get('property_data', function(data){
        data = data["property_data"]

        var table = document.getElementById('data_table')
        
        var sortable = []
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                element = data[key]
                if(element["ROI"]){
                    sortable.push([key, data[key]["yeild"]]);
                }
            }
        }

        sortable =  sortable.sort(function(a, b) {
            return a[1] - b[1];
        });


        sortable = sortable.reverse()
        var i = 0;
        var limit = 0
        limit = sortable.length

        for(i=0; i<limit; i++){
            key = sortable[i][0]
            const element = data[key];

            if( element["ROI"]){
                var tr = document.createElement("tr")
                var td1 = document.createElement("td")
                var td2 = document.createElement("td")
                var td3 = document.createElement("td")
                var td4 = document.createElement("td")
                var a_tag = document.createElement("a")

                link = element["link"]

                a_tag.setAttribute("href", link)
                a_tag.innerText = "Right Move";

                td1.appendChild(document.createTextNode(element["ROI"] +"%" ))
                td2.appendChild(document.createTextNode(element["yeild"] +"%" ))
                td3.appendChild(document.createTextNode("£"+ element["final_rent"] ))
                td4.appendChild(a_tag)

                tr.appendChild(td1)
                tr.appendChild(td2)
                tr.appendChild(td3)
                tr.appendChild(td4)
        
                table.appendChild(tr)
            }

        }
    });

}

function hide_all(){

    error_section.style.display = 'none'
    data_section.style.display = 'none'
    loader.style.display = 'none'

}


function filter(data){
    
}


function get_percent(per, limit){
    result = limit / 100
    result = result * per

    return Math.round(result)
}

main()

// It’s easy to calculate the rental 
// yield on an individual property. First, find your annual rental income for that property. 
// Then, divide this by the property value. Finally, multiply the figure by 100 to get the percentage
// var mydiv = document.getElementById("test");
// var aTag = document.createElement('a');
// aTag.setAttribute('href',"http://www.html.com");
// aTag.innerText = "link text";
// mydiv.appendChild(aTag);

// var a_tag = document.createElement("a")
// a_tag.setAttribute("href", element["link"])
// a_tag.innerHTML = "Right Move";

// Important Flags 
// ---==-===>   Completed Flag
// Discard btn is pressed Reset All flags