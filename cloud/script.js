//user defined variables
var max_clouds = 10;
var bubbles_enabled = 1;
//the time between checking the JSON data
var update_delay = 10000;
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
if ( getParameterByName( "max" ) ) {
  max_clouds = getParameterByName( "max" );
}
if ( getParameterByName( "bubbles" ) ) {
  bubbles_enabled = getParameterByName( "bubbles" );
}
if ( getParameterByName( "delay" ) ) {
  update_delay = getParameterByName( "delay" );
}

//function to calculate size based on cpus and memory of the vm
function format_size(info){
  //the two values mutliplied grow exponentially so a cube root evens out the growth
  out = info.alloc_cpu * info.alloc_mem;
  out = Math.sqrt(Math.sqrt(out));
  //the max cpus is 16 and the max memory is 32 so the highest possible value is the cube root of 512 which is ~4.75
  out = out / 5;
  //now the value is a float roughly between 0 and 1 so to get it in a range between 6 and 20 we:
  out = out * 14;
  out = out + 6;
  return(Math.floor(out));
}
function format_text(div, info){
  $(div).empty();
  $(div).append("<p id='vm_info'>Name: " + info.name + "</p>");
  $(div).append("<p id='vm_info'>Util: " + String(Math.round(info.util*10000)/10000) + "%</p>");
  $(div).append("<p id='vm_info'>CPUs: " + info.alloc_cpu + "</p>");
  $(div).append("<p id='vm_info'>Mem : " + info.alloc_mem + "GB</p>");
}

//value to check if the cloud is currently in the outdated.gif mode
var outdated = false;
function updateMOTD(message, load, timestamp, new_status){
  $("#motd").empty();
  //only show the message if there is one there
  if(message){
    $("#motd").append("<p style='white-space: normal'>Message: " + message + "</p>");
  }
  //work out time since last update
  var difference = new Date().getTime() - (Math.floor(timestamp * 1000));
  var minutes = Math.floor((difference / 1000) / 60);
  //only display last updated time if it is higher than usual
  if(minutes > 5){
    var seconds = "0" + Math.floor((difference / 1000) % 60);
    $("#motd").append("<p>Last updated: " + minutes + " minutes, " + seconds.substr(-2) + " seconds ago</p>");
    if(!outdated){
      outdated = true;
      $("#main_cloud").attr("src", "sprites/unknown.png");
    }
  }
  else if (outdated) {
    outdated = false;
    if(new_status == "ok"){
      $("#main_cloud").attr("src", "sprites/ok.gif");
    }
    else if (new_status == "degraded") {
      $("#main_cloud").attr("src", "sprites/degraded.gif");
    }
    else if (new_status == "down"){
      $("#main_cloud").attr("src", "sprites/down.gif");
    }
  }
  $("#motd").append("<p>Load: " + String(load) + " VMs</p>");
}

var status = "";
var vms_array = [];
setInterval(update_json, update_delay);
function update_json(){
  $.getJSON("hn/pretty-stats.json",function(data){
    //only change the main cloud image if the status has changed
    if(status !== data.status){
      status = data.status;
      if(data.status == "ok"){
        $("#main_cloud").attr("src", "sprites/ok.gif");
      }
      else if (data.status == "degraded") {
        $("#main_cloud").attr("src", "sprites/degraded.gif");
      }
      else if (data.status == "down"){
        $("#main_cloud").attr("src", "sprites/down.gif");
      }
      else{
        $("#main_cloud").attr("src", "sprites/unknown.png");
      }
    }
    updateMOTD(data.message, data.load, data.timestamp, data.status);
    vms_array = data.vms;
  });
}

var bg_array = [];
function preload(){
  update_json();
  //the JSON isnt updated as soon as the function runs because jquery does it asynchronously
  //dont generate any background clouds unless the JSON data is there
  if(!status){
    $("#motd").text("No JSON!");
    setTimeout(preload, 100);
  }
  else{
    for (i = 0; i < max_clouds; i++){
      var data_dict = {};
      //selecting a random vm from the list
      //might be worth avoiding duplicates
      var vm_info = vms_array[Math.floor(Math.random() * vms_array.length)];
      var img = document.createElement("img");

      data_dict.vm_info = vm_info;
      data_dict.img = img;

      img.id = "bg_cloud";
      img.src = "sprites/bg_cloud.png";

      var size = format_size(vm_info);
      var top = Math.floor(Math.random() * (100 - size));
      var cloud_top = String(top) + "%";
      var duration = String((Math.random()*15)+10) + "s";
      //making the delay negative means some clouds spawn mid screen when the page is refreshed
      var delay = String(-(Math.random()*20)) + "s";

      img.style.top = cloud_top;
      img.style.animationDuration = duration;
      img.style.animationDelay = delay;
      img.style.height = String(size) + "vh";
      //set the brightness to be a number between 1 and 0 depending on the utilisation
      //somehow the max util can be ~250 so we divide by 270 because 0 brightness looks bad
      img.style.filter = "brightness(" + String(1 - (vm_info.util / 270)) + ")";

      img.addEventListener("animationiteration", function(){
        //search through the array of background clouds until you find the one which has iterated
        for(i = 0; i < bg_array.length; i++){
          if(bg_array[i].img == this){
            bg_array[i].vm_info = vms_array[Math.floor(Math.random() * vms_array.length)];
            var new_size = format_size(bg_array[i].vm_info);
            var new_top = Math.floor(Math.random() * (100 - new_size));

            bg_array[i].img.style.top = String(new_top) + "%";
            bg_array[i].img.style.height = String(new_size) + "vh";
            bg_array[i].img.style.filter = "brightness(" + String(1 - (bg_array[i].vm_info.util / 270)) + ")";

            if(parseInt(bubbles_enabled)){
              //if the cloud is going to be in the top 25% of the screen, make the bubble be below the cloud
              //also flip the bubble so its apearing from the right part of the cloud
              if(new_top < 25){
                var new_bubbl_top = String(new_top + new_size + 1) + "%";
                var new_text_top = String(new_top + new_size + 5) + "%"
                bg_array[i].bbl.style["transform"] = "scaleY(-1)";
              }
              else{
                var new_bubbl_top = String(new_top - 20.5) + "%";
                var new_text_top = String(new_top - 19.5) + "%";
                bg_array[i].bbl.style["transform"] = "scaleY(1)";
              }
              bg_array[i].bbl.style.top = new_bubbl_top;
              bg_array[i].txt.style.top = new_text_top;
              format_text(bg_array[i].txt, bg_array[i].vm_info);
            }
          }
        }
      }, false);

      //only run code related to vm info bubbles if it is enabled
      //some machines cant handle 2 extra animations per background cloud
      if(parseInt(bubbles_enabled)){
        var bbl = document.createElement("img");
        var txt = document.createElement("div");

        data_dict.bbl = bbl;
        data_dict.txt = txt;

        bbl.id = "vm_bubble";
        txt.id = "vm_bubble";
        bbl.src = "sprites/bg_bubble.png";
        format_text(txt, vm_info);

        if(top < 25){
          var bubbl_top = String(top + size + 1) + "%";
          var text_top = String(top + size + 5) + "%";
          bbl.style.transform = "scaleY(-1)";
        }
        else{
          var bubbl_top = String(top - 20.5) + "%";
          var text_top = String(top - 19.5) + "%";
          bbl.style.transform = "scaleY(1)";
        }

        bbl.style.top = bubbl_top;
        txt.style.top = text_top;
        bbl.style.height = "20vh";
        bbl.style.animationDuration = duration;
        txt.style.animationDuration = duration;
        bbl.style.animationDelay = delay;
        txt.style.animationDelay = delay;

        img.onclick = function(){
          for(i = 0; i < bg_array.length; i++){
            if(bg_array[i].img == this){
              $(bg_array[i].img).toggleClass("clicked");
              $(bg_array[i].bbl).toggleClass("clicked");
              $(bg_array[i].txt).toggleClass("clicked");
            }
          }
        }

        $("#bg_cloud_container").append(bbl);
        $("#bg_cloud_container").append(txt);
      }
      $("#bg_cloud_container").append(img);
      bg_array.push(data_dict);
    }
  }
}
//http://dev-hn1.nubes.rl.ac.uk:8080/pretty-stats.json
