window.addEventListener('load', getReadings);
var stateButton = 0;

function sendAction1(val){
  
  if(stateButton == 0){
      stateButton = 1;
  }else{
      stateButton = 0;
  }
    changeStateLight();
    var xhttp = new XMLHttpRequest();
    xhttp.open("PUT", "/TURN?PAGE="+val+"&VALUE="+stateButton, true);
    xhttp.send(); 
}
function changeStateLight(){
  console.log(stateButton);
   
  if(stateButton == 0){
      document.getElementById("pulsador-button").classList.remove("pulsador-activado");
      document.body.style.backgroundColor = "white";
  }else{
      document.getElementById("pulsador-button").classList.add("pulsador-activado");
      document.body.style.backgroundColor = "#FAEFB9";

  }
}


function getData(){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var myObj = JSON.parse(this.responseText);
      console.log(myObj);
      var tempC = myObj.temperatureC;
      var tempF = myObj.temperatureF;
      var hum = myObj.humidity;
      var rs = myObj.rssi;
      var ip = myObj.ip;
      var hn = myObj.hostname;
      var wifiS = myObj.wifiStatus;
        var ssid = myObj.ssid;
        var psk = myObj.psk;
        var bssid = myObj.bssid;

      changeDataVisible(tempC, tempF, hum);
      signalChanger(parseInt( rs));
      buildTable(ip, hn, wifiS, ssid, psk, bssid);
     
    }
  }; 
  xhr.open("GET", "/readings", true);
  xhr.send();
}


// Create Temperature Gauge
var gaugeTempC = new LinearGauge({
  renderTo: 'gauge-temperatureC',
  width: 120,
  height: 600,
  units: "C",
  minValue: -10,
  value: -10,
  startAngle: 90,
  ticksAngle: 180,
  maxValue: 60,
  colorValueBoxRect: "#049faa",
  colorValueBoxRectEnd: "#049faa",
  colorValueBoxBackground: "#f1fbfc",
  valueDec: 2,
  valueInt: 2,
  majorTicks: [
      "-10",
      "-5",
      "0",
      "5",
      "10",
      "15",
      "20",
      "25",
      "30",
      "35",
      "40",
      "45",
      "50",
      "55",
      "60"
  ],
  minorTicks: 5,
  strokeTicks: true,
  highlights: [
      {
          "from": 40,
          "to": 60,
          "color": "rgba(200, 50, 50, .75)"
      }
  ],
  colorPlate: "#fff",
  colorBarProgress: "#CC2936",
  colorBarProgressEnd: "#049faa",
  borderShadowWidth: 0,
  borders: false,
  needleType: "arrow",
  needleWidth: 2,
  needleCircleSize: 7,
  needleCircleOuter: true,
  needleCircleInner: false,
  animationDuration: 1500,
  animationRule: "linear",
  barWidth: 10,
}).draw();




function getReadings(){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var tempC = myObj.temperatureC;
      gaugeTempC.value = tempC;
      var myObj = JSON.parse(this.responseText);
      console.log(myObj);
      receiveJson(myObj);
      
      signalChanger(parseInt(myObj.rssi)*-1);
      
     
    }
  }; 
  xhr.open("GET", "/readings", true);
  xhr.send();
}
function receiveJson(myObj){
  updateValuesInFront(
    myObj.rssi,
    myObj.ip,
    myObj.hostname,
    myObj.wifiStatus,
    myObj.ssid, 
    myObj.psk,
    myObj.bssid,
    myObj.statusFoco,
    myObj.pwm,
    myObj.limldr
  );
}
function updateValuesInFront(
  rssi,
  ip,
  hostname,
  wifiStatus,
  ssid, 
  psk,
  bssid,
  statusFoco,
  pwm,
  limldr
){
  if(pageCurrent == 4){
    document.getElementById("ldrlimval").innerHTML = limldr;
  }
  
   
  if(pageCurrent === 2){
    document.getElementById("pwmslider").value = pwm;
    document.getElementById("pwm_value3").innerHTML = pwm
  }
  
  stateButton = statusFoco;
  changeStateLight();
  buildTable(ip,hostname, wifiStatus, ssid,psk,bssid, rssi);
}
function buildTable(ip, hostname, wifi_status, ssid, psk , bssid, rssi){
  document.getElementById("ip").innerHTML = ip;
  document.getElementById("hn").innerHTML = hostname;
  document.getElementById("st").innerHTML = wifi_status;
  document.getElementById("ss").innerHTML = ssid;
  document.getElementById("ps").innerHTML = psk;
  document.getElementById("bs").innerHTML = bssid; 
  document.getElementById("rs").innerHTML = rssi; 
    
}




// adc chart 

var chartADC = new Highcharts.Chart({
  chart:{ renderTo:'chart-ADC' },
  title: { text: 'Valores de LDR' },
  series: [{
    showInLegend: false,
    data: []
  }],
  plotOptions: {
    line: { animation: false,
      dataLabels: { enabled: true }
    },
    series: { color: '#18009c' }
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { second:'%S' }
  },
  yAxis: {
    title: { text: 'Datos de LDR' }
  },
  credits: { enabled: false }
});
setInterval(getReadings, 1500);
setInterval(function ( ) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var myObj = JSON.parse(this.responseText);
      console.log("------3--------");
      console.log(myObj);
       
      var x = (new Date()).getTime(),
          y = parseFloat(myObj.ldr);
      //console.log(this.responseText);
      if(chartADC.series[0].data.length > 40) {
        chartADC.series[0].addPoint([x, y], true, true, true);
      } else {
        chartADC.series[0].addPoint([x, y], true, false, true);
      }
      if(pageCurrent === 3 || pageCurrent ===5){
        document.getElementById('pwm_value3').innerHTML = myObj.pwm;
      }

     

    }
  };
  xhttp.open("GET", "/LDR", true);
  xhttp.send();
}, 1000 ) ;

 /*
  function sendSliderValue(){
    var val = document.getElementById('pwmInput2').value;
        var xhttp = new XMLHttpRequest();
        xhttp.open("PUT", "/SLIDER?VALUE="+val, true);
        xhttp.send(); 
  }
 

function updateTextInput2(val) {
		console.log(val);
		document.getElementById('pwmInput2').value = val; 
		document.getElementById('textInput2').value = val; 
	}
*/
// page4

function consigue4(){
  alert(document.getElementById('hora_pick').value);
  var a   = document.getElementById('appt').value;
  if(a.length === 0){
    alert('dos esta vacio');
  }
}


function convierte(){
  var h1= document.getElementById("hour1").value;
  var m1 = document.getElementById("minute1").value;
  var s1 = document.getElementById("second1").value;
  var h2= document.getElementById("hour2").value;
  var m2 = document.getElementById("minute2").value;
  var s2 = document.getElementById("second2").value; 
        if(h1 == h2 && m2==m1 && s1 == s2){
          alert("por favor revisa las horas de entrada")
        }else{
        
          var now = new Date();
          var mls1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h1,m1,s1,0) - now;
          var mls2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h2,m2,s2,0) - now;
          if(mls1 < 0){
            mls1 += 86400000;
          }
          if(mls2 < 0){
            mls2 += 86400000;
          }

          if(mls1 > mls2){
            mls2 += 86400000;
          }
          console.log(mls1);
          console.log(mls1/3600000);
          console.log(mls2);
          console.log(mls2/3600000);

          setInterval(function(){
            var xhttp = new XMLHttpRequest();
            xhttp.open("PUT", "/TURN?PAGE="+3+"&VALUE="+1, true);
            xhttp.send(); 
          }, mls1);
          setInterval(function(){
            var xhttp = new XMLHttpRequest();
            xhttp.open("PUT", "/TURN?PAGE="+3+"&VALUE="+0, true);
            xhttp.send(); 
          }, mls2);

          
        }
        
        
      }
  
/* pagina 2*/

function sendPwm2(val){
    var value2 = document.getElementById('pwmslider').value;
    console.log(value2);
    var xhttp = new XMLHttpRequest();
    xhttp.open("PUT", "/PWM?PAGE="+val+"&VALUE="+value2, true);
    xhttp.send(); 
}

function sendLimitLDR(val){
  pageCurrent = val;
  var value2 = document.getElementById('ldrlimit').value;
    console.log(value2);
    var xhttp = new XMLHttpRequest();
    xhttp.open("PUT", "/LDRLIM?PAGE="+val+"&VALUE="+value2, true);
    xhttp.send();
}

function signalChanger(signal){
  const collection = document.getElementsByClassName("wave");
   
  var aux = 0;
  if(signal >= 50 && signal <60){
    aux = 1;
  }
  if(signal >= 60 && signal <70){
    aux = 2;
  }
  if(signal >= 70 && signal <80  ){
    aux = 3;
  }
  if(signal >= 80){
    aux = 4;
  }
  console.log(aux);
  for (let x = 0; x < collection.length; x++) {
    if (x<aux) {
      collection[x].classList.add("wv1");
    } else {
      collection[x].classList.remove("wv1");
    }
  }
}