const int pinSwitch = 2; // Pin conectado al microswitch

void setup() {
  pinMode(pinSwitch, INPUT_PULLUP); // Activa la resistencia pull-up interna
  Serial.begin(9600);              // Inicializa comunicación serial
}

void loop() {
  // Lee el estado del pin
  int estadoSwitch = digitalRead(pinSwitch);

  // Verifica el estado y muestra el mensaje correspondiente
  if (estadoSwitch == LOW) { // LOW indica que el microswitch está presionado
    Serial.println("Microswitch PRESIONADO");
  } else { // HIGH indica que el microswitch está suelto
    Serial.println("Microswitch SUELTO");
  }

  delay(1); // Evita sobrecargar el monitor serial
}