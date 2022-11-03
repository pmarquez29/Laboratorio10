#include <WiFi.h>  
#include "config.h"
#include <Arduino_JSON.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <stdlib.h>

boolean mod = false;
String estado="0";
int valor=0;

/*
Sensor LMR35
*/
#define ADC_VREF_mV    3300.0 // 3.3v en millivoltios
#define ADC_RESOLUTION 4096.0
#define pin_LM35       33 // ESP32 pin GIOP36 (ADC0) conectado al LM35
#define factor 0.0805860805860

int datoVal;
float milliVolt,tempC;

#define PWM1_Ch    0    //canales
#define PWM1_Res   8    //resolucion    
#define PWM1_Freq  1000  //frecuencia

int pwm1;
int PWM1_DutyCycle = 0;

String pwmValue;
 

int foco = 19;
int vent1 = 5;
int vent2= 18;

int pin_R = 21;
int pin_G = 22;
int pin_B = 23;


AsyncWebServer server(80);
//Definimos el puerto de comunicaciones
// Variable to store the HTTP request
String header;
 

JSONVar readings;
JSONVar temp;


void initWiFi() {
// conectamos al Wi-Fi
  WiFi.begin(ssid, password);
  // Mientras no se conecte, mantenemos un bucle con reintentos sucesivos
  while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      // Esperamos un segundo
      Serial.println("Conectando a la red WiFi..");
    }
  Serial.println();
  Serial.println(WiFi.SSID());
  Serial.print("Direccion IP:\t");
  // Imprimimos la ip que le ha dado nuestro router
  Serial.println(WiFi.localIP());
  
  s_ip = WiFi.localIP().toString().c_str();
  s_rssi = String(String(WiFi.RSSI()).toInt()*-1);
  s_hostname = WiFi.getHostname();
  s_wifiStatus =WiFi.status();
  s_ssid =WiFi.SSID().c_str();
  s_psk = WiFi.psk().c_str();
  s_bssid = WiFi.BSSIDstr().c_str(); 
  
}
String getValues(){
  
  readings["rssi"] = String(s_rssi);
  readings["ip"] = s_ip;
  readings["hostname"] = s_hostname;
  readings["wifiStatus"] = s_wifiStatus;
  readings["ssid"] = s_ssid;
  readings["psk"] = s_psk;
  readings["bssid"] = s_bssid;
  readings["statusFoco"] = s_foco;
  readings["pwm"] = value_pwm;
  readings["ldr"] = value_ldr;
  readings["limldr"] = limit_ldr;
  readings["pir"] = value_pir;
  String jsonString = JSON.stringify(readings);
  return jsonString;
}

 String gettemp(){
// Lectura de los datos del sensor
  datoVal = analogRead(pin_LM35);
  temp["datoVal"]   = String(datoVal);
   // Convirtiendo los datos del ADC a    milivoltios
  temp["mil"] =  String(datoVal * (ADC_VREF_mV / ADC_RESOLUTION));
  // Convirtiendo el voltaje al temperatura en °C
  temp["tempC"] =  datoVal * factor ; 
  temp["estado"]=estado;
  String jsonString = JSON.stringify(temp);
  return jsonString;
}


void setup() {


  Serial.begin(115200); // inicializando el pouerto serial


  
  pinMode(rele,OUTPUT);
  pinMode(vent1,OUTPUT);
  pinMode(vent2,OUTPUT);

  pinMode(33,INPUT);

  pinMode(pin_R,OUTPUT);
  pinMode(pin_G,OUTPUT);
  pinMode(pin_B,OUTPUT);


  initWiFi();

 // digitalWrite(ledRojo, LOW); digitalWrite(ledVerde, LOW); digitalWrite(PinLedB, LOW);  
  if(!SPIFFS.begin())
     { Serial.println("ha ocurrido un error al montar SPIFFS");
       return; }
  
  //Serial.println(WiFi.localIP());
  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    estado="0";
    request->send(SPIFFS, "/index.html",String(), false);
    
  });   
  server.on("/CONTROL", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/control.html",String(), false);
  });   
  server.on("/HORARIO", HTTP_GET, [](AsyncWebServerRequest *request){
    estado="0";
    request->send(SPIFFS, "/horario.html",String(), false);
    
  });    
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
            request->send(SPIFFS, "/style.css", "text/css");
            });      
            /*  
server.on("/ADC", HTTP_GET, [](AsyncWebServerRequest *request){
    String json = getSensorReadings();
    request->send(200, "application/json", json);
    json = String();
  });
  */
  
 /*
  * 
  */

   server.on("/INFO", HTTP_GET, [](AsyncWebServerRequest *request){
    String json = getinfo();
    request->send(200, "application/json", json);
    json = String();
  });


  server.on("/TEMP", HTTP_GET, [](AsyncWebServerRequest *request){
    datoVal=analogRead(33);
    String json = gettemp();
    request->send(200, "application/json", json);
    json = String();
  });
  


server.on("/ON", HTTP_GET, [](AsyncWebServerRequest *request){
             digitalWrite(rele, HIGH); 
              digitalWrite(pin_R,255);
              digitalWrite(pin_G,0);
              digitalWrite(pin_B,0);
             //String json = getserv();
             Serial.print("Encendido");
           request->send(0);
   // json = String();
            });
server.on("/OFF", HTTP_GET, [](AsyncWebServerRequest *request){
            digitalWrite(rele, LOW); 
            digitalWrite(ledRojo,0);
            digitalWrite(ledVerde,0);
            digitalWrite(ledAzul,0);

             //String json = getserv();
            Serial.print("Apagado");
           request->send(0);
   // json = String();
            });
//Ventilador 
server.on("/VON", HTTP_GET, [](AsyncWebServerRequest *request){
             digitalWrite(vent1, HIGH); 
             digitalWrite(vent2, HIGH);
             //String json = getserv();
             Serial.print("Encendido");
             digitalWrite(ledRojo,0);
             digitalWrite(ledVerde,0);
             digitalWrite(ledAzul,255);
           request->send(0);
   // json = String();
            });
server.on("/VOFF", HTTP_GET, [](AsyncWebServerRequest *request){
             digitalWrite(rele2, LOW);
            digitalWrite(rele3, LOW); 

             //String json = getserv();
             digitalWrite(ledRojo,0);
             digitalWrite(ledVerde,0);
             digitalWrite(ledAzul,0);
            Serial.print("Apagado");
           request->send(0);
   // json = String();
            });

server.on("/SET_POINT", HTTP_POST, [](AsyncWebServerRequest *request){
            pwmValue = request->arg("set_point");
            valor=pwmValue.toInt();
            request->redirect("/CONTROL");
                  
            });  
server.on("/TRUE", HTTP_GET, [](AsyncWebServerRequest *request){ 
 mod=true;
request->send(0);
   // json = String();
            });
server.on("/FALSE", HTTP_GET, [](AsyncWebServerRequest *request){ 
mod=false;
request->send(0);
// json = String();
});
            
server.on("/SLIDER", HTTP_POST, [](AsyncWebServerRequest *request){
            pwmValue = request->arg("bomb");
            Serial.print("PWM:\t");
            Serial.println(pwmValue);
            ledcWrite(PWM_Ch, pwmValue.toInt()); 
            request->redirect("/");
                  
            });  

  server.begin();

}  
void loop() {
  datoVal =50;
  float datoC=datoVal*factor;
if(mod==true){
  if (datoC>(valor*1.05)){
    digitalWrite(rele, LOW);    
    digitalWrite(vent1, HIGH);
    digitalWrite(vent2, HIGH);
    estado="1";
  }else if (datoC<(valor*0.95)){
    digitalWrite(rele, HIGH);    
    digitalWrite(vent1,LOW);
    digitalWrite(vent2,LOW);
    estado="2";
  }
}else {
   estado="0";
}
delay (1000);
  
}
