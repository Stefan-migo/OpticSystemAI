---
product_landing_what_it_offers:
  - title: Qué ofrece
  - message: Combina distintas funcionalidades para garantizar la seguridad y conversión de las operaciones.
  - benefit_title: Personalización
  - benefit_bullet: Financiamiento en cuotas.
  - benefit_bullet: URL de retorno tras aprobar el pago.
  - benefit_bullet: Apariencia y estilo del botón de pago.
  - benefit_bullet: Medios de pago combinables y customizables.
  - benefit_title: Conversión
  - benefit_bullet: Cobro ágil con los medios de pago guardados en Mercado Pago.
  - benefit_bullet: Opción de pagar sin cuenta de Mercado Pago, como usuario invitado.
  - benefit_bullet: Medios de pago online y offline, como tarjetas y dinero en cuenta.
  - benefit_bullet: Recuperación de pagos rechazados.
  - benefit_title: Aprobación de pagos
  - benefit_bullet: Tecnología 3DS 2.0 para autenticación de operaciones.
  - benefit_bullet: Herramientas de prevención de fraudes y comprobación de identidad de cliente.
  - benefit_bullet: Validación de transacciones utilizando datos específicos de cada industria.
  - benefit_title: Seguridad ante fraudes
  - benefit_bullet: Protocolos OWASP y PCI DSS.
  - benefit_bullet: Verificación de identidad de los compradores.
  - benefit_bullet: Reconocimiento facial con FaceAuth para ingresar a la cuenta de Mercado Pago.
---

---

product_landing_what_differentiates:

- title: Qué lo diferencia
- message: Compara nuestros checkouts y elige el que mejor se adapte a tu negocio. Consulta las .
- highlight_text: Estás aquí
- column_product_svg_image: checkout-pro-es
- column_product: Checkout Pro
- column_button_text: Cómo integrar
- column_button_link: /developers/es/docs/checkout-pro/create-application
- column_product_svg_image: checkout-api-es
- column_product:
- column_button_text: Ir al resumen
- column_button_link: /developers/es/docs/checkout-api-payments/overview
- column_product_svg_image: checkout-bricks-es
- column_product: Checkout Bricks
- column_button_text: Ir al resumen
- column_button_link: /developers/es/docs/checkout-bricks/landing
- line_text: Esfuerzo de integración
- line_type: dots
- line_values: 2|5|3
- line_text: Nivel de personalización
- line_type: dots
- line_values: 2|5|3
- line_text: Diseño listo para configurar
- line_type: check
- line_values: true|false|true
- line_text: Experiencia de cobro
- line_type: text
- line_values: En Mercado Pago|En tu sitio|En tu sitio
- line_text: Pagos recurrentes
- line_type: check
- line_values: false|true|true
- line_text: Medios de pago
- line_type: text
- line_values: Tarjeta de crédito o débito, Cuenta Mercado Pago y Cuotas sin Tarjeta|Tarjeta de crédito o débito y Cuenta Mercado Pago|Tarjeta de crédito o débito y Cuenta Mercado Pago
- line_text: Disponibilidad por país
- line_type: sites
- line_values: all|all|all

---

---

product_landing_how_integrate:

- title: Cómo integrar
- sub_title: Conoce las etapas que deberás seguir para integrar esta solución.
- requirement_title: Requisitos previos
- requirement_table_title: Cuenta de vendedor
- requirement_table_list: Para integrar Checkout Pro, necesitas ingresar a Mercado Pago y [crear una cuenta de vendedor](https://www.mercadopago[FAKER][URL][DOMAIN]/hub/registration/landing).
- requirement_table_title: Certificado SSL (Secure Sockets Layer)
- requirement_table_list: Permite la navegación segura y la protección de tus datos durante las transferencias de información.

---

## |||column1|||

product_landing_how_integrate:

- list_title: Proceso de integración
- list_item: Crear una aplicación.
- list_item: Configurar el ambiente de desarrollo.
- list_item: Crear y configurar una preferencia de pago.
- list_item: Configurar las URLs de retorno.
- list_item: Agregar el SDK al frontend e inicializar el checkout.
- list_item: Configurar las notificaciones de pago.
- list_item: Probar la integración.
- list_item: Salir a producción.
- button_description: Quiero comenzar a integrar
- button_link: /developers/es/docs/checkout-pro/create-application

---

|||column2|||

<div class="mermaid-overview">
  <pre class="mermaid">
  flowchart TD
            A["Ir a Tus integraciones"] --> B["Crear aplicación"]
            B --> C["Construir el ambiente"]
            C --> D["Crear preferencias de pago"]
            D -- Monto, medios de pago, detalles, otros --> F["Configurar las notificaciones"]
            F -- Webhooks e IPN --> E["Probar la integración"]
            E -- Pruebas exitosas --> H["Salir a producción"]
            E -- Errores detectados --> I["Corregir configuración"]
            I --> H
            H --> J["Medir calidad"]
  </pre>
</div>
|||

---

# Crear aplicación

Las **aplicaciones** son entidades registradas dentro de Mercado Pago que actúan como un identificador único para gestionar la autenticación y autorización de tus integraciones. Es decir, son el vínculo entre tu desarrollo y Mercado Pago, y constituyen la primera etapa para realizar la integración.

Con ellas, es posible acceder a las :toolTipComponent[credenciales]{link="/developers/es/docs/credentials" linkText="Credenciales" content="Claves de acceso únicas con las que identificamos una integración en tu cuenta, vinculadas a tu aplicación. Para más información, accede al link a continuación."} necesarias para interactuar con nuestras APIs o servicios específicos, así como gestionar y organizar tu integración, por lo que deberás crear una aplicación por cada solución de Mercado Pago que integres.

Para crear una **aplicación**, sigue los pasos a continuación.

1. En la esquina superior derecha de Mercado Pago Developers, haz clic en **Ingresar** e ingresa los datos requeridos con la información correspondiente a tu cuenta de Mercado Pago.
2. Con la sesión iniciada, en la esquina superior derecha de Mercado Pago Developers, haz clic en **Crear aplicación** si tu cuenta aún no tiene ninguna aplicación creada, o accede a "Tus integraciones" y selecciona **Ver todas**. Allí, haz clic en **Crear aplicación**.
3. Una vez dentro de **Tus integraciones**, haz clic en el botón **Crear aplicación**.

> NOTE
>
> Para proteger tu cuenta, durante la creación de una aplicación será necesario que realices una verificación de identidad, en caso de que aún no la hayas realizado, o una reautenticación, si ya has completado previamente el proceso de verificación.

![create-application-1](/images/snippets/create-application-1-es.png)

4. Ingresa un **nombre** para identificar tu aplicación. El límite es de hasta 50 caracteres alfanuméricos.
5. Selecciona **Pagos online** como el tipo de pago que quieres integrar, ya que es el tipo de solución correspondiente a tiendas virtuales. Haz clic **Continuar**.
6. Selecciona que estás integrando para una tienda hecha con desarrollo propio. Opcionalmente podrás completar la URL de tu tienda. Haz clic en **Continuar**.
7. Selecciona la opción **Checkouts** y luego selecciona **Checkout Pro** como la solución que vas a integrar.
8. Confirma las opciones seleccionadas. En caso de que necesites modificar alguna selección, puedes hacer clic en el botón **Editar**. Acepta la y los [Términos y condiciones](/developers/es/docs/resources/legal/terms-and-conditions) y haz clic en **Confirmar**.

![Resumen de aplicación](/images/snippets/create-application/ES-new-app-CHO-PRO.png)

En [Tus integraciones](/developers/panel/app) podrás consultar el listado de todas tus aplicaciones creadas y acceder a los [Datos de integración](/developers/es/docs/checkout-pro/resources/application-details) de cada una de ellas.

> NOTE
>
> Si lo deseas, puedes editar o eliminar una aplicación. En este último caso, debes tener en cuenta que tu tienda perderá la capacidad de recibir pagos a través de la integración con Mercado Pago asociada a esa aplicación. Para más información, consulta los [Datos de integración](/developers/es/docs/checkout-pro/resources/application-details).

## Acceder a las credenciales de prueba

Después de crear tu aplicación, automáticamente también se crearán las :toolTipComponent[credenciales de prueba]{link="/developers/es/docs/checkout-pro/resources/credentials" linkText="Credenciales" content="Claves de acceso únicas con las que identificamos una integración en tu cuenta, vinculadas a tu aplicación. Para más información, accede al link a continuación."}. Utiliza las **credenciales de prueba** para realizar todas las configuraciones y validaciones necesarias en un entorno seguro de pruebas.

Al acceder a las credenciales de prueba, se mostrarán los siguientes pares de credenciales: :toolTipComponent[Public Key]{content="Clave pública que es utilizada en el _frontend_ para acceder a información y cifrar datos. Puedes acceder a ella a través de _Tus integraciones > Detalles de aplicación > Pruebas > Credenciales de prueba_."} y el :toolTipComponent[Access Token]{content="Clave privada de la aplicación creada en Mercado Pago, que es utilizada en el _backend_. Puedes acceder a ella a través de _Tus integraciones > Detalles de aplicación > Pruebas > Credenciales de prueba_."} de prueba.

![credenciales de test](/images/snippets/credentials/app-data-test-credentials-es.png)

> NOTE
>
> Si estás utilizando una aplicación ya existente, será necesario activar las credenciales de prueba. Para más información, consulta la documentación de [Credenciales](/developers/es/docs/checkout-pro/additional-content/credentials).

---

# Configurar ambiente de desarrollo

Para comenzar a integrar las soluciones de cobro de Mercado Pago, es necesario preparar tu ambiente de desarrollo con una serie de configuraciones que te permitirán acceder a las funcionalidades de Mercado Pago desde el backend.

A continuación, deberás instalar y configurar el SDK oficial de Mercado Pago:

> SERVER_SIDE
>
> h2
>
> Instalar el SDK de Mercado Pago

El **SDK de backend** está diseñado para manejar las operaciones del lado del servidor, permitiéndote crear y gestionar :toolTipComponent[preferencias de pago]{content="Una preferencia de pago es un objeto o conjunto de información que representa el producto o servicio por el que deseas cobrar. Dentro del ecosistema de Mercado Pago, este objeto se conoce como `preference`."}, procesar transacciones y llevar a cabo otras operaciones críticas de manera segura.

> NOTE
>
> Si lo prefieres, puedes descargar los SDKs de Mercado Pago en nuestras [bibliotecas oficiales](/developers/es/docs/sdks-library/server-side).

Instala el SDK de Mercado Pago en el lenguaje que mejor se ajuste a tu integración utilizando un gestor de dependencias, tal como mostramos a continuación.

[[[

```php
===
Para instalar el SDK debes ejecutar el siguiente código en la línea de comandos de tu terminal usando [Composer](https://getcomposer.org/download):
===
php composer.phar require "mercadopago/dx-php"
```

```node
===
Para instalar el SDK debes ejecutar el siguiente código en la línea de comandos de tu terminal usando [npm](https://www.npmjs.com/get-npm):
===
npm install mercadopago
```

```java
===
Para instalar el SDK en tu proyecto [Maven](http://maven.apache.org/install.html), debes agregar la siguiente dependencia en tu archivo <code>pom.xml</code> y ejecutar <code>maven install</code> en la línea de comandos de tu terminal:
===
<dependency>
   <groupId>com.mercadopago</groupId>
   <artifactId>sdk-java</artifactId>
   <version>2.1.7</version>
</dependency>
```

```ruby
===
Para instalar la SDK, debes ejecutar el siguiente código en la línea de comandos de tu terminal usando [Gem](https://rubygems.org/gems/mercadopago-sdk):
===
gem install mercadopago-sdk
```

```csharp
===

===
nuget install mercadopago-sdk
```

```python
===
Para instalar el SDK debes ejecutar el siguiente código en la línea de comandos de tu terminal usando [Pip](https://pypi.org/project/mercadopago/):
===
pip3 install mercadopago
```

```go
go get -u github.com/mercadopago/sdk-go
```

]]]

> SERVER_SIDE
>
> h2
>
> Inicializar biblioteca de Mercado Pago

A continuación, crea un archivo principal (_main_) en el _backend_ de tu proyecto con el lenguaje de programación que estés utilizando. Allí, coloca el siguiente código reemplazando el valor `TEST_ACCESS_TOKEN` con el :toolTipComponent[Access Token de pruebas]{content="Clave privada de pruebas de la aplicación creada en Mercado Pago, que es utilizada en el backend. Puedes acceder a ella a través de _Tus integraciones_ en la sección _Datos de integración_, dirigiéndote a la sección _Credenciales_ ubicada a la derecha de la pantalla y haciendo clic en _Prueba_. Alternativamente, puedes ingresar a través de _Tus integraciones > Detalles de aplicación > Pruebas > Credenciales de prueba_."}.

[[[

```php
<?php
// SDK de Mercado Pago
use MercadoPago\MercadoPagoConfig;
// Agrega credenciales
MercadoPagoConfig::setAccessToken("TEST_ACCESS_TOKEN");
?>
```

```node
// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from "mercadopago";
// Agrega credenciales
const client = new MercadoPagoConfig({ accessToken: "YOUR_ACCESS_TOKEN" });
```

```java
// SDK de Mercado Pago
import com.mercadopago.MercadoPagoConfig;
// Agrega credenciales
MercadoPagoConfig.setAccessToken("TEST_ACCESS_TOKEN");
```

```ruby
# SDK de Mercado Pago
require 'mercadopago'
# Agrega credenciales
sdk = Mercadopago::SDK.new('TEST_ACCESS_TOKEN')
```

```csharp
// SDK de Mercado Pago
 using MercadoPago.Config;
 // Agrega credenciales
MercadoPagoConfig.AccessToken = "TEST_ACCESS_TOKEN";
```

```python
# SDK de Mercado Pago
import mercadopago
# Agrega credenciales
sdk = mercadopago.SDK("TEST_ACCESS_TOKEN")
```

```go
import (
	"github.com/mercadopago/sdk-go/pkg/config"
)

cfg, err := config.New("{{ACCESS_TOKEN}}")
if err != nil {
	fmt.Println(err)
}
```

]]]

Después de estas configuraciones, tu ambiente de desarrollo ya está listo para avanzar con la configuración de una preferencia de pago.

---

> SERVER_SIDE
>
> h1
>
> Crear y configurar una preferencia de pago

Una **preferencia de pago** es un objeto o conjunto de información que representa el producto o servicio por el que deseas cobrar. Dentro del ecosistema de Mercado Pago, este objeto se conoce como `preference`. Al crear una preferencia de pago, puedes definir detalles esenciales como el precio, la cantidad y los medios de pago, así como otras configuraciones relacionadas para el flujo de pago.

Durante esta etapa, también agregarás los **medios de pago** que deseas ofrecer con Checkout Pro, que por defecto incluye todos los medios de pago disponibles en Mercado Pago.

> WARNING
>
> Para ofrecer pagos a través de Fintoc, es necesario aceptar los términos y condiciones de la solución. Para ello, accede a [Tu negocio > Configuración > Preferencias de pago](https://www.mercadopago.cl/business/cashing-preferences), lee los términos y condiciones y, si estás de acuerdo, habilita la opción **Recibir pagos por transferencia bancaria**.

Para crear una preferencia de pago, utiliza el método asociado a `preference` en el SDK de backend. Es necesario que **crees una preferencia de pago para cada pedido o flujo de pago** que quieras iniciar.

A continuación, encontrarás ejemplos de cómo implementar esto en tu backend utilizando el SDK, que está disponible en diferentes lenguajes de programación. Completa los atributos con la información adecuada para reflejar los detalles de cada transacción y garantizar un flujo de pago preciso.

> NOTE
>
> Puedes adaptar la integración de Checkout Pro a tu modelo de negocio configurando los atributos de la preferencia de pago. Estos te permitirán definir cuotas, excluir un medio de pago, cambiar la fecha de vencimiento de un determinado pago, entre otras opciones. Para personalizar tu preferencia de pago, accede a la documentación en la sección de **Configuraciones adicionales**.

[[[

```php
<?php
$client = new PreferenceClient();
$preference = $client->create([
  "items"=> array(
    array(
      "title" => "Mi producto",
      "quantity" => 1,
      "unit_price" => 2000
    )
  )
]);

echo $preference
?>
```

```node
const preference = new Preference(client);

preference
  .create({
    body: {
      items: [
        {
          title: "Mi producto",
          quantity: 1,
          unit_price: 2000,
        },
      ],
    },
  })
  .then(console.log)
  .catch(console.log);
```

```java
PreferenceItemRequest itemRequest =
       PreferenceItemRequest.builder()
           .id("1234")
           .title("Games")
           .description("PS5")
           .pictureUrl("http://picture.com/PS5")
           .categoryId("games")
           .quantity(2)
           .currencyId("BRL")
           .unitPrice(new BigDecimal("4000"))
           .build();
   List<PreferenceItemRequest> items = new ArrayList<>();
   items.add(itemRequest);
PreferenceRequest preferenceRequest = PreferenceRequest.builder()
.items(items).build();
PreferenceClient client = new PreferenceClient();
Preference preference = client.create(preferenceRequest);
```

```ruby
# Crea un objeto de preferencia
preference_data = {
  items: [
    {
      title: 'Mi producto',
      unit_price: 75.56,
      quantity: 1
    }
  ]
}
preference_response = sdk.preference.create(preference_data)
preference = preference_response[:response]

# Este valor reemplazará el string "<%= @preference_id %>" en tu HTML
@preference_id = preference['id']
```

```csharp
// Crea el objeto de request de la preference
var request = new PreferenceRequest
{
    Items = new List<PreferenceItemRequest>
    {
        new PreferenceItemRequest
        {
            Title = "Mi producto",
            Quantity = 1,
            CurrencyId = "ARS",
            UnitPrice = 75.56m,
        },
    },
};

// Crea la preferencia usando el client
var client = new PreferenceClient();
Preference preference = await client.CreateAsync(request);
```

```python
# Crea un ítem en la preferencia
preference_data = {
    "items": [
        {
            "title": "Mi producto",
            "quantity": 1,
            "unit_price": 75.76,
        }
    ]
}

preference_response = sdk.preference().create(preference_data)
preference = preference_response["response"]
```

```go
import (
  "github.com/mercadopago/sdk-go/pkg/preference"
)

client := preference.NewClient(cfg)

request := preference.Request{
	Items: []preference.ItemRequest{
		{
			Title:       "My product",
			Quantity:    1,
			UnitPrice:   75.76,
		},
	},
}

resource, err := client.Create(context.Background(), request)
if err != nil {
	fmt.Println(err)
	return
}

fmt.Println(resource)
```

]]]

## Obtener el identificador de la preferencia

El identificador de la preferencia es un identificador de transacción único para una solicitud de pago específica. Para obtenerlo, deberas ejecutar tu aplicación.

En la respuesta, obtendrás el **identificador de la preferencia** en la propiedad `ID`. **Guarda este valor, ya que lo necesitarás en el próximo paso para tu integración** en un sitio web o en una aplicación mobile.

A continuación, te mostramos un ejemplo de cómo se ve el atributo `ID` con el identificador de preferencia en una respuesta.

```
"id": "787997534-6dad21a1-6145-4f0d-ac21-66bf7a5e7a58"
```

### Elegir el tipo de integración

Una vez que hayas obtenido tu ID de la preferencia, deberás avanzar a las configuraciones del frontend. Para eso, es necesario que elijas el tipo de integración que mejor se adapte a tus necesidades, ya sea para integrar un **sitio web** o para una **aplicación móvil**.

Selecciona el tipo de integración que quieres hacer y sigue los pasos detallados para completar la integración de Checkout Pro.

---

future_product_avaible:

- card_avaible: true
- card_icon: Laptop
- card_title: Continuar integración para sitios web
- card_description: Ofrece cobros con redirección a Mercado Pago en tu sitio web o tienda online.
- card_button: /developers/es/docs/checkout-pro/configure-back-urls
- card_buttonDescription: Integración web
- card_pillText: DISPONIBLE
- card_linkAvailable: false
- card_linkProof:
- card_linkProofDescription:
- card_avaible: true
- card_icon: Smartphone
- card_title: Continuar integración para aplicaciones móviles
- card_description: Ofrece cobros con redirección Mercado Pago en tu aplicación para dispositivos móviles.
- card_button: /developers/es/docs/checkout-pro/mobile-integration
- card_buttonDescription: Integración mobile
- card_pillText: DISPONIBLE
- card_linkAvailable: false
- card_linkProof:
- card_linkProofDescription:

---

# Configurar URLs de retorno

La URL de retorno es la dirección a la que se redirige al usuario después de completar el pago, ya sea exitoso, fallido o pendiente. Esta URL debe ser una página web que controles, como un servidor con dominio nombrado (DNS).

Este proceso se configura a través del atributo `back_urls` en el backend, en la preferencia de pago asociada a tu integración. Con este atributo podrás definir que el comprador sea redirigido al sitio web que configuraste, ya sea automáticamente o a través del botón "Volver al sitio", según el estado del pago.

Puedes configurar hasta tres URL de retorno diferentes, que corresponderán a los escenarios de pago pendiente, éxito o error.

> NOTE
>
> En integraciones mobile, recomendamos que las URLs de retorno sean deep links. Para conocer más, ve a la documentación [Integración para aplicaciones móviles](/developers/es/docs/checkout-pro/mobile-integration).

## Definir URL de retorno

En tu código backend, deberás configurar la URL a la que quieres que Mercado Pago redirija al usuario una vez que haya completado el proceso de pago.

> NEUTRAL_MESSAGE
>
> Si lo prefieres, también es posible configurar las URLs de retorno a través del envío POST a la API [Crear preferencia](/developers/es/reference/preferences/_checkout_preferences/post) con el atributo `back_urls` informando las URLs a las que se debe dirigir al comprador al finalizar el pago.

A continuación, te compartimos ejemplos de cómo incluir el atributo `back_urls` según el lenguaje de programación que estés utilizando, además del detalle de cada uno de los posibles parámetros.

[[[

```php
<?php
$preference = new MercadoPago\Preference();
//...
$preference->back_urls = array(
    "success" => "https://www.tu-sitio/success",
    "failure" => "https://www.tu-sitio/failure",
    "pending" => "https://www.tu-sitio/pending"
);
$preference->auto_return = "approved";
// ...
?>
```

```node
const preference = new Preference(client);
preference.create({
  body: {
    // ...
    back_urls: {
      success: "https://www.tu-sitio/success",
      failure: "https://www.tu-sitio/failure",
      pending: "https://www.tu-sitio/pending",
    },
    auto_return: "approved",
  },
});
// ...
```

```java
PreferenceBackUrlsRequest backUrls =
// ...
   PreferenceBackUrlsRequest.builder()
       .success("https://www.tu-sitio/success")
       .pending("https://www.tu-sitio/pending")
       .failure("https://www.tu-sitio/failure")
       .build();

PreferenceRequest request = PreferenceRequest.builder().backUrls(backUrls).build();
// ...
```

```ruby
# ...
preference_data = {
  # ...
  back_urls: {
    success: 'https://www.tu-sitio/success',
    failure: 'https://www.tu-sitio/failure',
    pending: 'https://www.tu-sitio/pendings'
  },
  auto_return: 'approved'
  # ...
}
# ...
```

```csharp
var request = new PreferenceRequest
{
    // ...
    BackUrls = new PreferenceBackUrlsRequest
    {
        Success = "https://www.tu-sitio/success",
        Failure = "https://www.tu-sitio/failure",
        Pending = "https://www.tu-sitio/pendings",
    },
    AutoReturn = "approved",
};
```

```python
preference_data = {
    "back_urls": {
        "success": "https://www.tu-sitio/success",
        "failure": "https://www.tu-sitio/failure",
        "pending": "https://www.tu-sitio/pendings"
    },
    "auto_return": "approved"
}
```

]]]

| Atributo      | Descripción                                                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto_return` | Los compradores son redirigidos automáticamente al site cuando se aprueba el pago. El valor predeterminado es `approved`. **El tiempo de redireccionamiento será de hasta 40 segundos y no podrá ser personalizado**. Por defecto, también se mostrará un botón de "Volver al sitio". |
| `back_urls`   | URL de retorno al sitio. Los escenarios posibles son: <br>`success`: URL de retorno cuando se aprueba el pago.<br>`pending`: URL de retorno cuando el pago está pendiente.<br>`failure`: URL de retorno cuando se rechaza el pago.                                                    |

## Respuesta de las URLs de retorno

Las `back_urls` devolverán, a través de un llamado GET, algunos parámetros útiles. A continuación, te compartimos un ejemplo de cómo se verá una respuesta y el detalle de los parámetros que podrás encontrar en ella.

```curl
GET /test?collection_id=106400160592&collection_status=rejected&payment_id=106400160592&status=rejected&external_reference=qweqweqwe&payment_type=credit_card&merchant_order_id=29900492508&preference_id=724484980-ecb2c41d-ee0e-4cf4-9950-8ef2f07d3d82&site_id=MLC&processing_mode=aggregator&merchant_account_id=null HTTP/1.1
Host: yourwebsite.com
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: es-419,es;q=0.9
Connection: keep-alive
Referer: https://www.mercadopago.com/checkout/v1/payment/redirect/505f641c-cf04-4407-a7ad-8ca471419ee5/congrats/rejected/?preference-id=724484980-ecb2c41d-ee0e-4cf4-9950-8ef2f07d3d82&router-request-id=0edb64e3-d853-447a-bb95-4f810cbed7f7&p=f2e3a023dd16ac953e65c4ace82bb3ab
Sec-Ch-Ua: "Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "macOS"
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: cross-site
Sec-Fetch-User: ?1
Upgrade-Insecure-Requests: 1
```

| Parámetro            | Descripción                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `payment_id`         | ID (identificador) del pago de Mercado Pago.                                                       |
| `status`             | Status del pago. Por ejemplo: `approved` para un pago aprobado o `pending` para un pago pendiente. |
| `external_reference` | Referencia que puedes sincronizar con tu sistema de pagos.                                         |
| `merchant_order_id`  | ID (identificador) de la orden de pago generada en Mercado Pago.                                   |

### Respuesta en medios de pago offline

Los medios de pago offline son aquellos en donde el usuario comprador elige un medio de pago que requiere que utilice un punto de pago físico para completar el proceso de compra. En este flujo de pago, Mercado Pago generará un comprobante que el usuario necesita para realizar el pago en el establecimiento correspondiente, y redireccionará al usuario a la URL que especificaste en el atributo `back_urls` como `pending`.

En este punto, el pago está en estado pendiente porque el usuario todavía tiene que ir a un establecimiento físico y pagar.

Para brindarle mayor información al comprador, recomendamos que, para los estados de pago `pending`, redirecciones al comprador a tu sitio web y le compartas información clara sobre cómo completar el pago.

Una vez que el usuario va al establecimiento correspondiente y realiza el pago en efectivo con el comprobante generado, Mercado pago es notificado y el pago cambiará de estado. Recomendamos que [configures las notificaciones de pago](/developers/es/docs/checkout-pro/payment-notifications) para que tu servidor pueda procesar esta notificación y actualizar el estado del pedido en tu base de datos.

---

> CLIENT_SIDE
>
> h1
>
> Agregar el SDK al frontend e inicializar el checkout

Una vez que hayas configurado tu backend, es necesario que configures el frontend para completar la experiencia de cobro del lado del cliente. Para esto, puedes utilizar el SDK MercadoPago.js, que permite capturar pagos directamente en el frontend de manera segura.

En esta sección, verás cómo incluirlo e inicializarlo correctamente, para finalmente renderizar el botón de pago de Mercado Pago.

> Si lo prefieres, puedes descargar el SDKs MercadoPago.js en nuestras [bibliotecas oficiales](/developers/es/docs/sdks-library/client-side/mp-js-v2).

:::::TabsComponent

::::TabComponent{title="Incluir el SDK con HTML/js"}

## Incluir el SDK con HTML/js

Para incluir el SDK MercadoPago.js en tu página HTML desde un **CDN (Content Delivery Network)**, primero deberás agregar la etiqueta `<script>` justo antes de la etiqueta `</body>` en tu archivo HTML principal, tal como te mostramos en el siguiente ejemplo.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Mi Integración con Checkout Pro</title>
  </head>
  <body>
    <!-- Contenido de tu página -->

    <script src="https://sdk.mercadopago.com/js/v2"></script>

    <script>
      // Tu código JavaScript irá aquí
    </script>
  </body>
</html>
```

## Inicializar el checkout desde la preferencia de pago

Después de incluir el SDK en tu frontend, es momento de inicializarlo y luego iniciar el checkout.

Para continuar, utiliza tu credencial :toolTipComponent[Public Key de pruebas]{content="Clave pública de pruebas, que es utilizada en el frontend para acceder a información y cifrar datos, sea en la etapa de desarrollo o en la de pruebas. Puedes acceder a ella a través de **Tus integraciones > Detalles de aplicación > Pruebas > Credenciales de prueba**."}.

> NOTE
>
> Si estás desarrollando para otra persona, podrás acceder a las credenciales de las aplicaciones que no administras. Consulta [Compartir credenciales](/developers/es/docs/checkout-pro/resources/credentials) para más información.

También necesitarás utilizar el identificador de la preferencia de pago que obtuviste como respuesta en [Crear y configurar una preferencia de pago](/developers/es/docs/checkout-pro/create-payment-preference).

A continuación, para inicializar el SDK utilizando un CDN, deberás ejecutar este código dentro de la etiqueta `<script>`, reemplazando el valor `YOUR_PUBLIC_KEY`por tu clave y `YOUR_PREFERENCE_ID` por el **identificador de la preferencia de pago**.

```Javascript
<script src="https://sdk.mercadopago.com/js/v2"></script>
<script>
  // Configure sua chave pública do Mercado Pago
  const publicKey = "YOUR_PUBLIC_KEY";
  // Configure o ID de preferência que você deve receber do seu backend
  const preferenceId = "YOUR_PREFERENCE_ID";

  // Inicializa o SDK do Mercado Pago
  const mp = new MercadoPago(publicKey);

  // Cria o botão de pagamento
  const bricksBuilder = mp.bricks();
  const renderWalletBrick = async (bricksBuilder) => {
    await bricksBuilder.create("wallet", "walletBrick_container", {
      initialization: {
        preferenceId: "<PREFERENCE_ID>",
      }
});
  };

  renderWalletBrick(bricksBuilder);
</script>
```

> CLIENT_SIDE
>
> h2
>
> Crear un contenedor HTML para el botón de pago

Por último, necesitarás crear un contenedor en tu HTML para definir la ubicación en la cual se mostrará el botón de pago de MercadoPago. La creación del contenedor se realiza insertando un elemento en el código HTML de la página en la que se representará el componente.

```html
<!-- Container para o botão de pagamento -->
<div id="walletBrick_container"></div>
```

## Renderizar el botón de pago

El SDK de Mercado Pago renderizará automáticamente un botón dentro de este elemento, que será responsable de redirigir al comprador hacia un formulario de compra en el ambiente de Mercado Pago, tal como se muestra en la siguiente imagen.

![Button](/images/cow/wallet-render-es.png)
::::

::::TabComponent{title="Instalar el SDK utilizando React"}

## Instalar el SDK utilizando react

Para incluir el SDK MercadoPago.js en el frontend de tu proyecto React, primero deberás configurar tu entorno de React. Para eso, asegúrate de tener **Node.js** y **npm** instalados en tu sistema. Si no los tienen, descárgalos desde el [sitio oficial de Node.js](http://Node.js).

En tu terminal o línea de comandos, ejecuta el siguiente comando para crear una nueva aplicación de React:

```
npx create-react-app my-mercadopago-app
```

Esto creará un nuevo directorio llamado `my-mercadopago-app` con una estructura básica de aplicación React.

### Instalar SDK MercadoPago.js

Instala la biblioteca SDK MercadoPago.js en el directorio `my-mercadopago-app`. Puedes hacerlo ejecutando el siguiente comando:

```
npm install @mercadopago/sdk-react
```

## Crear un componente para el botón de pago

Abre el archivo `src/App.js` de tu aplicación React. Una vez allí, modifica el contenido del archivo para integrar el componente `wallet` de Mercado Pago, que es el encargado de mostrar el botón de pago de Mercado Pago.

Para continuar, utiliza tu credencial :toolTipComponent[Public Key de pruebas]{content="Clave pública de pruebas, que es utilizada en el frontend para acceder a información y cifrar datos, sea en la etapa de desarrollo o en la de pruebas. Puedes acceder a ella a través de **Tus integraciones > Detalles de aplicación > Pruebas > Credenciales de prueba**."}.

> NOTE
>
> Si estás desarrollando para otra persona, podrás acceder a las credenciales de las aplicaciones que no administras. Consulta [Compartir credenciales](/developers/es/docs/checkout-pro/resources/credentials) para más información.

También necesitarás utilizar el identificador de la preferencia de pago que obtuviste como respuesta en [Crear y configurar una preferencia de pago](/developers/es/docs/checkout-pro/create-payment-preference).

A continuación, sustituye el valor `YOUR_PUBLIC_KEY`por tu clave y `YOUR_PREFERENCE_ID` por el **identificador de la preferencia de pago** en el archivo `src/App.js`. Observa el siguiente ejemplo.

```JavaScript
import React from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Inicializa Mercado Pago con tu Public Key
initMercadoPago('YOUR_PUBLIC_KEY');

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Botón de Pago</h1>
      <p>Haz clic en el botón para realizar el pago.</p>
      {/* Renderiza el botón de pago */}
      <div style={{ width: '300px' }}>
        <Wallet initialization={{ preferenceId: 'YOUR_PREFERENCE_ID' }} />
      </div>
    </div>
  );
};

export default App;
```

## Renderizar el botón de pago

Al ejecutar tu aplicación en React, el SDK de Mercado Pago renderizará el botón de pago que será responsable de redirigir al comprador hacia un formulario de compra en el ambiente de Mercado Pago, tal como se muestra en la siguiente imagen.

![Button](/images/cow/wallet-render-es.png)
::::

:::::

<br>

Una vez que hayas finalizado la configuración de tu frontend, deberás configurar las [Notificaciones](/developers/es/docs/checkout-pro/payment-notifications) para que tu integración reciba información en tiempo real sobre los eventos que ocurren en tu integración.

---

# Configurar notificaciones de pago

Las notificaciones **Webhooks**, también conocidas como **devoluciones de llamada web**, son un método efectivo que permiten a los servidores de Mercado Pago enviar información en **tiempo real** cuando ocurre un evento específico relacionado con tu integración.

En lugar de que tu sistema realice consultas constantes para verificar actualizaciones, los Webhooks permiten la transmisión de datos de manera **pasiva y automática** entre Mercado Pago y tu integración a través de una solicitud **HTTP POST**, optimizando la comunicación y reduciendo la carga en los servidores.

Consulta el flujo general de una notificación en el diagrama a continuación.

![Diagram](/images/cow/notifications-diagrama-es.jpg)

A continuación, presentamos un paso a paso para configurar las notificaciones de creación y actualización de pagos. Una vez configuradas, las notificaciones Webhook se enviarán cada vez que se cree un pago o se modifique su estado (Pendiente, Rechazado o Aprobado).

> NOTE
>
> Esta documentación trata exclusivamente de la configuración de notificaciones de pago, incluidas creaciones y actualizaciones, a través del evento **Pagos**. Para obtener información sobre otros eventos de notificaciones disponibles para configuración, consulta la [documentación de Notificaciones](/developers/es/docs/checkout-pro/additional-content/notifications) general.

En el proceso de integración con Mercado Pago, puedes configurar las notificaciones de dos maneras:

| Tipo de Configuración                             | Descripción                                                                                                                                                                                                                                                                    | Ventajas                                                                                                                                                                                                                                                                                                                                                                                            | Cuándo Usar                                                                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración a través de Tus Integraciones       | Este método permite configurar notificaciones directamente en tu Panel de Desarrollador. Puedes configurar notificaciones para cada una de tus aplicaciones, identificar cuentas distintas si es necesario, y validar el origen de la notificación mediante una firma secreta. | - Identificación sencilla de cuentas distintas, asegurando una adecuada gestión en entornos diversos. <br> - Alta seguridad al validar el origen de las notificaciones mediante una firma secreta, que garantiza la integridad de la información recibida. <br> - Más versátil y eficaz para mantener un control centralizado y gestionar la comunicación con las aplicaciones de manera eficiente. | Recomendado para la mayoría de las integraciones.                                                                                                                                                                     |
| Configuración durante la creación de preferencias | Las notificaciones se configuran para cada transacción individualmente durante la creación de la preferencia.                                                                                                                                                                  | - Ajustes específicos para cada transacción. <br> - Flexibilidad en casos de necesidad de parámetros dinámicos obligatorios. <br> - Ideal para integraciones como plataformas de pago para múltiples vendedores.                                                                                                                                                                                    | Conveniente en los casos en que sea necesario enviar un query parameter dinámico de forma obligatoria, además de ser adecuado para integraciones que funcionan como una plataforma de pago para múltiples vendedores. |

> RED_MESSAGE
>
> Importante
>
> Las URLs configuradas durante la creación de un pago tendrán prioridad por sobre aquellas configuradas a través de Tus integraciones.

:::::TabsComponent

::::TabComponent{title="Configuración a través de Tus integraciones"}

## Configuración a través de Tus integraciones

Puedes configurar notificaciones para cada una de tus aplicaciones directamente desde [Tus integraciones](/developers/panel/app) de manera eficiente y segura. En este apartado, explicaremos cómo:

1. Indicar las URLs de notificación y configurar eventos
2. Validar el origen de una notificación
3. Simular el recibimiento de una notificación

### 1. Indicar URLs de notificación y configurar el evento

Para configurar notificaciones Webhooks, es necesario indicar las URLs a las que las mismas serán enviadas.
Para hacerlo, sigue el paso a paso a continuación:

1. Ingresa a [Tus integraciones](/developers/panel/app) y selecciona la aplicación integrada con Checkout Pro para la que deseas activar las notificaciones.

![Application](/images/cow/not1-select-app-es.png)

2. En el menú de la izquierda, selecciona **Webhooks > Configurar notificaciones**.

![Webhooks](/images/cow/not2-webhooks-es.png)

3. Selecciona la pestaña **Modo productivo** y proporciona una `URL HTTPS` para recibir notificaciones con tu integración productiva.

![URL](/images/cow/not3-url-es.png)

4. Selecciona el evento **Pagos** para recibir notificaciones, que serán enviadas en formato `JSON` a través de un `HTTPS POST` a la URL especificada anteriormente.

![Payment](/images/cow/not4-payment-es.png)

5. Por último, haz clic en **Guardar configuración**. Esto generará una **clave secreta** exclusiva para la aplicación, que permitirá validar la autenticidad de las notificaciones recibidas, garantizando que hayan sido enviadas por Mercado Pago. Ten en cuenta que esta clave generada no tiene plazo de caducidad y su renovación periódica no es obligatoria, aunque sí recomendada. Para hacerlo, basta con cliquear en el botón **Restablecer**.

### 2. Simular la recepción de la notificación

Para garantizar que las notificaciones sean configuradas correctamente, es necesario simular su recepción. Para hacerlo, sigue el paso a paso a continuación.

1. Después de configurar las URLs y los Eventos, haz clic en **Guardar configuración**.
2. Luego, haz clic en **Simular** para probar si la URL indicada está recibiendo las notificaciones correctamente.
3. En la pantalla de simulación, selecciona la URL que se va a probar, que puede ser **la URL de prueba o la de producción**.
4. A continuación, elige el **tipo de evento** e ingresa la **identificación** que se enviará en el cuerpo de la notificación (Data ID).
5. Por último, haz clic en **Enviar prueba** para verificar la solicitud, la respuesta proporcionada por el servidor y la descripción del evento. Recibirás una respuesta similar al ejemplo a continuación, que representa el `body` de la notificación recibida en tu servidor.

```
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "123456"
  },
  "date_created": "2021-11-01T02:02:02Z",
  "id": "123456",
  "live_mode": false,
  "type": "payment",
  "user_id": 724484980
}
```

### 3. Validar origen de la notificación

La validación del origen de una notificación es fundamental para asegurar la seguridad y la autenticidad de la información recibida. Este proceso ayuda a prevenir fraudes y garantiza que solo las notificaciones legítimas sean procesadas.

Mercado Pago enviará a su servidor una notificación similar al ejemplo a continuación para una alerta del tópico `payment`. En este ejemplo, se incluye la notificación completa, que contiene los `query params`, el `body` y el `header` de la notificación.

- **_Query params_**: Son parámetros de consulta que acompañan la URL. En el ejemplo, tenemos `data.id=123456` y `type=payment`.
- **_Body_**: El cuerpo de la notificación contiene información detallada sobre el evento, como `action`, `api_version`, `data`, `date_created`, `id`, `live_mode`, `type` y `user_id`.
- **_Header_**: El encabezado contiene metadatos importantes, incluyendo la firma secreta de la notificación `x-signature`.

```
POST /test?data.id=123456&type=payment HTTP/1.1
Host: prueba.requestcatcher.com
Accept: */*
Accept-Encoding: *
Connection: keep-alive
Content-Length: 177
Content-Type: application/json
Newrelic: eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkFwcCIsImFjIjoiOTg5NTg2IiwiYXAiOiI5NjA2MzYwOTQiLCJ0eCI6IjU3ZjI4YzNjOWE2ODNlZDYiLCJ0ciI6IjY0NjA0OTM3OWI1ZjA3MzMyZDdhZmQxMjEyM2I5YWE4IiwicHIiOjAuNzk3ODc0LCJzYSI6ZmFsc2UsInRpIjoxNzQyNTA1NjM4Njg0LCJ0ayI6IjE3MDk3MDcifX0=
Traceparent: 00-646049379b5f07332d7afd12123b9aa8-e7f77a41f687aecd-00
Tracestate: 1709707@nr=0-0-989586-960636094-e7f77a41f687aecd-57f28c3c9a683ed6-0-0.797874-1742505638684
User-Agent: restclient-node/4.15.3
X-Request-Id: bb56a2f1-6aae-46ac-982e-9dcd3581d08e
X-Rest-Pool-Name: /services/webhooks.js
X-Retry: 0
X-Signature: ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b
X-Socket-Timeout: 22000
{"action":"payment.updated","api_version":"v1","data":{"id":"123456"},"date_created":"2021-11-01T02:02:02Z","id":"123456","live_mode":false,"type":"payment","user_id":724484980}
```

A partir de la notificación Webhook recibida, podrás validar la autenticidad de su origen. Mercado Pago siempre incluirá la clave secreta en las notificaciones Webhooks que serán recibidas, lo que permitirá validar su autenticidad. Esta clave será enviada en el _header_ `x-signature`, que será similar al ejemplo debajo.

```
`ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b`
```

Para confirmar la validación, es necesario extraer la clave contenida en el _header_ y compararla con la clave otorgada para tu aplicación en Tus integraciones. Para eso, sigue el paso a paso a continuación. Al final, disponibilizamos nuestros SDKs con ejemplos de códigos completos para facilitar el proceso.

1. Para extraer el timestamp (`ts`) y la clave (`v1`) del header `x-signature`, divide el contenido del _header_ por el carácter “,", lo que resultará en una lista de elementos. El valor para el prefijo `ts` es el _timestamp_ (en milisegundos) de la notificación y _v1_ es la clave encriptada. Siguiendo el ejemplo presentado anteriormente, `ts=1742505638683` y `v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b`.
2. Utilizando el _template_ a continuación, sustituye los parámetros con los datos recibidos en tu notificación.

```
id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
```

- Los parámetros con el sufijo `_url` provienen de _query params_. Ejemplo: [data.id_url] se sustituirá por el valor correspondiente al ID del evento (`data.id`). Este _query param_ puede ser hallado en la notificación recibida. En el ejemplo de notificación mencionado anteriormente, el `data.id_url` es `123456`.
- [x-request-id_header] deberá ser sustituido por el valor recibido en el _header_ `x-request-id`. En el ejemplo de notificación mencionado anteriormente, el `x-request-id` es `bb56a2f1-6aae-46ac-982e-9dcd3581d08e`.
- [ts_header] será el valor `ts` extraído del _header_ `x-signature`. En el ejemplo de notificación mencionado anteriormente, el `ts` es `1742505638683`.
- Al aplicar los datos al _template_, quedaría de la siguiente manera:
  `id:123456;request-id:bb56a2f1-6aae-46ac-982e-9dcd3581d08e;ts:1742505638683;`

> RED_MESSAGE
>
> Importante
>
> Si alguno de los valores presentados en el modelo anterior no está presente en la notificación recibida, debes removerlo.

3. En [Tus integraciones](/developers/panel/app), selecciona la aplicación integrada, haz clic en **Webhooks > Configurar notificación** y revela la clave secreta generada.

![Signature](/images/cow/not6-signature-es.png)

4. Genera la contraclave para la validación. Para hacer esto, calcula un [HMAC](https://es.wikipedia.org/wiki/HMAC) con la función de `hash SHA256` en base hexadecimal, utilizando la **clave secreta** como clave y el template con los valores como mensaje.

[[[

```php
$cyphedSignature = hash_hmac('sha256', $data, $key);
```

```node
const crypto = require("crypto");
const cyphedSignature = crypto
  .createHmac("sha256", secret)
  .update(signatureTemplateParsed)
  .digest("hex");
```

```java
String cyphedSignature = new HmacUtils("HmacSHA256", secret).hmacHex(signedTemplate);
```

```python
import hashlib, hmac, binascii

cyphedSignature = binascii.hexlify(hmac_sha256(secret.encode(), signedTemplate.encode()))
```

]]]

5. Finalmente, compara la clave generada con la clave extraída del _header_, asegurándote de que tengan una correspondencia exacta. Además, puedes usar el _timestamp_ extraído del header para compararlo con un timestamp generado en el momento de la recepción de la notificación, con el fin de establecer una tolerancia de demora en la recepción del mensaje.

A continuación, puedes ver ejemplos de código completo:

[[[

```php
<?php
// Obtain the x-signature value from the header
$xSignature = $_SERVER['HTTP_X_SIGNATURE'];
$xRequestId = $_SERVER['HTTP_X_REQUEST_ID'];

// Obtain Query params related to the request URL
$queryParams = $_GET;

// Extract the "data.id" from the query params
$dataID = isset($queryParams['data.id']) ? $queryParams['data.id'] : '';

// Separating the x-signature into parts
$parts = explode(',', $xSignature);

// Initializing variables to store ts and hash
$ts = null;
$hash = null;

// Iterate over the values to obtain ts and v1
foreach ($parts as $part) {
    // Split each part into key and value
    $keyValue = explode('=', $part, 2);
    if (count($keyValue) == 2) {
        $key = trim($keyValue[0]);
        $value = trim($keyValue[1]);
        if ($key === "ts") {
            $ts = $value;
        } elseif ($key === "v1") {
            $hash = $value;
        }
    }
}

// Obtain the secret key for the user/application from Mercadopago developers site
$secret = "your_secret_key_here";

// Generate the manifest string
$manifest = "id:$dataID;request-id:$xRequestId;ts:$ts;";

// Create an HMAC signature defining the hash type and the key as a byte array
$sha = hash_hmac('sha256', $manifest, $secret);
if ($sha === $hash) {
    // HMAC verification passed
    echo "HMAC verification passed";
} else {
    // HMAC verification failed
    echo "HMAC verification failed";
}
?>
```

```javascript
// Obtain the x-signature value from the header
const xSignature = headers["x-signature"]; // Assuming headers is an object containing request headers
const xRequestId = headers["x-request-id"]; // Assuming headers is an object containing request headers

// Obtain Query params related to the request URL
const urlParams = new URLSearchParams(window.location.search);
const dataID = urlParams.get("data.id");

// Separating the x-signature into parts
const parts = xSignature.split(",");

// Initializing variables to store ts and hash
let ts;
let hash;

// Iterate over the values to obtain ts and v1
parts.forEach((part) => {
  // Split each part into key and value
  const [key, value] = part.split("=");
  if (key && value) {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey === "ts") {
      ts = trimmedValue;
    } else if (trimmedKey === "v1") {
      hash = trimmedValue;
    }
  }
});

// Obtain the secret key for the user/application from Mercadopago developers site
const secret = "your_secret_key_here";

// Generate the manifest string
const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;

// Create an HMAC signature
const hmac = crypto.createHmac("sha256", secret);
hmac.update(manifest);

// Obtain the hash result as a hexadecimal string
const sha = hmac.digest("hex");

if (sha === hash) {
  // HMAC verification passed
  console.log("HMAC verification passed");
} else {
  // HMAC verification failed
  console.log("HMAC verification failed");
}
```

```python
import hashlib
import hmac
import urllib.parse

# Obtain the x-signature value from the header
xSignature = request.headers.get("x-signature")
xRequestId = request.headers.get("x-request-id")

# Obtain Query params related to the request URL
queryParams = urllib.parse.parse_qs(request.url.query)

# Extract the "data.id" from the query params
dataID = queryParams.get("data.id", [""])[0]

# Separating the x-signature into parts
parts = xSignature.split(",")

# Initializing variables to store ts and hash
ts = None
hash = None

# Iterate over the values to obtain ts and v1
for part in parts:
    # Split each part into key and value
    keyValue = part.split("=", 1)
    if len(keyValue) == 2:
        key = keyValue[0].strip()
        value = keyValue[1].strip()
        if key == "ts":
            ts = value
        elif key == "v1":
            hash = value

# Obtain the secret key for the user/application from Mercadopago developers site
secret = "your_secret_key_here"

# Generate the manifest string
manifest = f"id:{dataID};request-id:{xRequestId};ts:{ts};"

# Create an HMAC signature defining the hash type and the key as a byte array
hmac_obj = hmac.new(secret.encode(), msg=manifest.encode(), digestmod=hashlib.sha256)

# Obtain the hash result as a hexadecimal string
sha = hmac_obj.hexdigest()
if sha == hash:
    # HMAC verification passed
    print("HMAC verification passed")
else:
    # HMAC verification failed
    print("HMAC verification failed")
```

```go
import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Obtain the x-signature value from the header
		xSignature := r.Header.Get("x-signature")
		xRequestId := r.Header.Get("x-request-id")

		// Obtain Query params related to the request URL
		queryParams := r.URL.Query()

		// Extract the "data.id" from the query params
		dataID := queryParams.Get("data.id")

		// Separating the x-signature into parts
		parts := strings.Split(xSignature, ",")

		// Initializing variables to store ts and hash
		var ts, hash string

		// Iterate over the values to obtain ts and v1
		for _, part := range parts {
			// Split each part into key and value
			keyValue := strings.SplitN(part, "=", 2)
			if len(keyValue) == 2 {
				key := strings.TrimSpace(keyValue[0])
				value := strings.TrimSpace(keyValue[1])
				if key == "ts" {
					ts = value
				} else if key == "v1" {
					hash = value
				}
			}
		}

		// Get secret key/token for specific user/application from Mercadopago developers site
		secret := "your_secret_key_here"

		// Generate the manifest string
		manifest := fmt.Sprintf("id:%v;request-id:%v;ts:%v;", dataID, xRequestId, ts)

		// Create an HMAC signature defining the hash type and the key as a byte array
		hmac := hmac.New(sha256.New, []byte(secret))
		hmac.Write([]byte(manifest))

		// Obtain the hash result as a hexadecimal string
		sha := hex.EncodeToString(hmac.Sum(nil))

if sha == hash {
    // HMAC verification passed
    fmt.Println("HMAC verification passed")
} else {
    // HMAC verification failed
    fmt.Println("HMAC verification failed")
}

	})
}
```

]]]
::::

::::TabComponent{title="Configuración al crear preferencias"}

## Configuración al crear preferencias

Durante el proceso de creación de [preferencias](/developers/es/reference/preferences/_checkout_preferences/post), es posible configurar la URL de notificación de forma más específica para cada pago utilizando el campo `notification_url`.

> RED_MESSAGE
>
> Importante
>
> La `notification_url` debe ser una URL con protocolo HTTPS. Esto garantiza que las notificaciones se transmitan de forma segura y que los datos intercambiados estén encriptados, protegiendo la integridad y confidencialidad de la información. Además, HTTPS autentica que la comunicación se realiza con el servidor legítimo, evitando posibles interceptaciones malintencionadas.

A continuación, explicamos cómo configurar notificaciones al crear un pago utilizando nuestros SDKs.

1. En el campo `notification_url`, indica la URL desde la que se recibirán las notificaciones, como se muestra a continuación.

[[[

```php
<?php
$client = new PreferenceClient();
$preference = $client->create([
  "notification_url" => "https://www.your_url_to_notification.com/",
  "items"=> array(
    array(
      "title" => "Mi producto",
      "quantity" => 1,
      "unit_price" => 2000
    )
  )
]);

echo $preference
?>
```

```node
const preference = new Preference(client);

preference
  .create({
    body: {
      notification_url: "https://www.your_url_to_notification.com/",
      items: [
        {
          title: "Mi producto",
          quantity: 1,
          unit_price: 2000,
        },
      ],
    },
  })
  .then(console.log)
  .catch(console.log);
```

```java
PreferenceItemRequest itemRequest =
       PreferenceItemRequest.builder()
           .id("1234")
           .title("Games")
           .description("PS5")
           .pictureUrl("http://picture.com/PS5")
           .categoryId("games")
           .quantity(2)
           .currencyId("BRL")
           .unitPrice(new BigDecimal("4000"))
           .build();
   List<PreferenceItemRequest> items = new ArrayList<>();
   items.add(itemRequest);
PreferenceRequest preferenceRequest = PreferenceRequest.builder()
.items(items).build();
PreferenceClient client = new PreferenceClient();
Preference preference = client.create(request);

```

```ruby
# Crea un objeto de preferencia
preference_data = {
  notification_url: 'https://www.your_url_to_notification.com/',
  items: [
    {
      title: 'Mi producto',
      unit_price: 75.56,
      quantity: 1
    }
  ]
}
preference_response = sdk.preference.create(preference_data)
preference = preference_response[:response]

# Este valor reemplazará el string "<%= @preference_id %>" en tu HTML
@preference_id = preference['id']

```

```csharp
// Crea el objeto de request de la preference
var request = new PreferenceRequest
{
    Items = new List<PreferenceItemRequest>
    {
        new PreferenceItemRequest
        {
            Title = "Mi producto",
            Quantity = 1,
            CurrencyId = "ARS",
            UnitPrice = 75.56m,
        },
    },
};

// Crea la preferencia usando el client
var client = new PreferenceClient();
Preference preference = await client.CreateAsync(request);

```

```python
# Crea un ítem en la preferencia
preference_data = {
    "notification_url" : "https://www.your_url_to_notification.com/",
    "items": [
        {
            "title": "Mi producto",
            "quantity": 1,
            "unit_price": 75.76,
        }
    ]
}

preference_response = sdk.preference().create(preference_data)
preference = preference_response["response"]
```

```go
client := preference.NewClient(cfg)

request := preference.Request{
	Items: []preference.ItemRequest{
		{
			Title:       "My product",
			Quantity:    1,
			UnitPrice:   75.76,
		},
	},
}

resource, err := client.Create(context.Background(), request)
if err != nil {
	fmt.Println(err)
	return
}

fmt.Println(resource)

```

]]]

2. Implementa el receptor de notificaciones usando el siguiente código como ejemplo:

```php
<?php
 MercadoPago\SDK::setAccessToken("ENV_ACCESS_TOKEN");
 switch($_POST["type"]) {
     case "payment":
         $payment = MercadoPago\Payment::find_by_id($_POST["data"]["id"]);
         break;
     case "plan":
         $plan = MercadoPago\Plan::find_by_id($_POST["data"]["id"]);
         break;
     case "subscription":
         $plan = MercadoPago\Subscription::find_by_id($_POST["data"]["id"]);
         break;
     case "invoice":
         $plan = MercadoPago\Invoice::find_by_id($_POST["data"]["id"]);
         break;
     case "point_integration_wh":
         // $_POST contiene la informaciòn relacionada a la notificaciòn.
         break;
 }
?>
```

Luego de realizar la configuración necesaria, la notificación Webhook será enviada con formato `JSON`. Puedes ver a continuación un ejemplo de notificación del tópico `payment`, y las descripciones de la información enviada en la tabla debajo.

> WARNING
>
> Importante
>
> Los pagos de prueba, creados con credenciales de prueba, no enviarán notificaciones. La única vía para probar la recepción de notificaciones es mediante la [Configuración a través de Tus integraciones](/developers/es/docs/your-integrations/notifications/webhooks#configuracinatravsdetusintegraciones).

```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2015-03-25T10:04:58.396-04:00",
  "user_id": 44444,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": "999999999"
  }
}
```

| Atributo         | Descripción                                                                                                                                         | Ejemplo en el JSON              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **id**           | ID de la notificación                                                                                                                               | `12345`                         |
| **live_mode**    | Indica si la URL ingresada es válida.                                                                                                               | `true`                          |
| **type**         | Tipo de notificacion recebida e acuerdo con el tópico previamente seleccionado (payments, mp-connect, subscription, claim, automatic-payments, etc) | `payment`                       |
| **date_created** | Fecha de creación del recurso notificado                                                                                                            | `2015-03-25T10:04:58.396-04:00` |
| **user_id**      | Identificador del vendedor                                                                                                                          | `44444`                         |
| **api_version**  | Valor que indica la versión de la API que envía la notificación                                                                                     | `v1`                            |
| **action**       | Evento notificado, que indica si es una actualización de un recurso o la creación de uno nuevo                                                      | `payment.created`               |
| **data.id**      | ID del pago, de la orden comercial o del reclamo.                                                                                                   | `999999999`                     |

::::

:::::

Una vez que las notificaciones sean configuradas, consulta las acciones necesarias después de recibir una notificación para informar que las mismas fueron debidamente recibidas:

## Acciones necesarias después de recibir la notificación

Cuando recibes una notificación en tu plataforma, Mercado Pago espera una respuesta para validar que esa recepción fue correcta. Para eso, debes devolver un `HTTP STATUS 200 (OK)` o `201 (CREATED)`.

El tiempo de espera para esa confirmación será de 22 segundos. Si no se envía esta respuesta, el sistema entenderá que la notificación no fue recibida y realizará un nuevo intento de envío cada 15 minutos, hasta que reciba la respuesta. Después del tercer intento, el plazo será prorrogado, pero los envíos continuarán sucediendo.

<pre class="mermaid">
sequenceDiagram
    participant MercadoPago as Mercado Pago
    participant Integrador as Integrador

    MercadoPago->>Integrador: reintento: 1. Demora: 0 minutos
    MercadoPago->>Integrador: reintento: 2. Demora: 15 minutos
    MercadoPago->>Integrador: reintento: 3. Demora: 30 minutos
    MercadoPago->>Integrador: reintento: 4. Demora: 6 horas
    MercadoPago->>Integrador: reintento: 5. Demora: 48 horas
    MercadoPago->>Integrador: reintento: 6. Demora: 96 horas
    MercadoPago->>Integrador: reintento: 7. Demora: 96 horas
    MercadoPago->>Integrador: reintento: 8. Demora: 96 horas
</pre>

Luego de responder la notificación, confirmando su recibimiento, puedes obtener toda la información sobre el evento del tópico `payments` notificado haciendo un GET al endpoint [v1/payments/{id}](/developers/es/reference/payments/_payments_id/get).

Con esta información podrás realizar las actualizaciones necesarias a tu plataforma, como por ejemplo, actualizar un pago aprobado.

Además, para consultar el estado del evento posterior a la notificación, puedes utilizar los diferentes métodos de nuestros SDKs para realizar la consulta con el ID que fue enviado en la notificación.

[[[

```java
MercadoPago.SDK.setAccessToken("ENV_ACCESS_TOKEN");
switch (type) {
    case "payment":
        Payment payment = Payment.findById(data.id);
        break;
    case "plan":
        Plan plan = Plan.findById(data.id);
        break;
    case "subscription":
        Subscription subscription = Subscription.findById(data.id);
        break;
    case "invoice":
        Invoice invoice = Invoice.findById(data.id);
        break;
    case "point_integration_wh":
        // POST contiene la informaciòn relacionada a la notificaciòn.
        break;
}
```

```node
mercadopago.configurations.setAccessToken("ENV_ACCESS_TOKEN");
switch (type) {
  case "payment":
    const payment = await mercadopago.payment.findById(data.id);
    break;
  case "plan":
    const plan = await mercadopago.plans.get(data.id);
    break;
  case "subscription":
    const subscription = await mercadopago.subscriptions.get(data.id);
    break;
  case "invoice":
    const invoice = await mercadopago.invoices.get(data.id);
    break;
  case "point_integration_wh":
    // Contiene la informaciòn relacionada a la notificaciòn.
    break;
}
```

```ruby
sdk = Mercadopago::SDK.new('PROD_ACCESS_TOKEN')

case payload['type']
when 'payment'
    payment = sdk.payment.search(filters: { id: payload['data']['id'] })
when 'plan'
    plan = sdk.preapproval_plan.search(filters: { id: data['data']['id'] })
end
```

```csharp
MercadoPagoConfig.AccessToken = "ENV_ACCESS_TOKEN";
switch (type)
{
    case "payment":
        Payment payment = await Payment.FindByIdAsync(payload["data"]["id"].ToString());
        break;
    case "plan":
        Plan plan = await Plan.FindByIdAsync(payload["data"]["id"].ToString());
        break;
    case "subscription":
        Subscription subscription = await Subscription.FindByIdAsync(payload["data"]["id"].ToString());
        break;
    case "invoice":
        Invoice invoice = await Invoice.FindByIdAsync(payload["data"]["id"].ToString());
        break;
    case "point_integration_wh":
        // Contiene la informaciòn relacionada a la notificaciòn.
        break;
}
```

```python
sdk = mercadopago.SDK("ENV_ACCESS_TOKEN")
notification_type = data["type"]
if notification_type == "payment":
    payment = sdk.payment().get(payload["data"]["id"])
elif notification_type == "plan":
    plan = sdk.preapproval().get(payload["data"]["id"])
elif notification_type == "subscription":
    subscription = sdk.preapproval().get(payload["data"]["id"])
elif notification_type == "invoice":
    invoice = sdk.invoice().get(payload["data"]["id"])
elif notification_type == "point_integration_wh":
    # Contiene la informaciòn relacionada a la notificaciòn.
else:
    return
```

```golang
cfg, err := config.New("ENV_ACCESS_TOKEN")
if err != nil {
    fmt.Println(err)
}

switch req.Body.Type {
case "payment":
    client := payment.NewClient(cfg)
    resource, err = client.Get(context.Background(), req.Body.data.id)
    if err != nil {
        fmt.Println(err)
        return
    }
case "plan":
    client := preapprovalplan.NewClient(cfg)
    resource, err := client.Get(context.Background(), req.Body.data.id)
    if err != nil {
        fmt.Println(err)
        return
    }
}
```

]]]

---

# Prueba de integración

Las pruebas son una etapa esencial para garantizar que la integración funcione correctamente y que los pagos se procesen sin errores. Esto evita fallos cuando el checkout esté disponible para los compradores.

Para ello, utiliza la cuenta de prueba comprador creada automáticamente con tu aplicación. Con ella, es posible simular pagos y validar su funcionamiento.

A continuación, presentamos el paso a paso:

## Obtener una cuenta de prueba comprador

Para probar la integración, realiza una compra de prueba utilizando la cuenta de prueba comprador que fue creada automáticamente con tu aplicación. Para encontrarla, sigue los pasos a continuación.

1. En [Mercado Pago Developers](/developers/es/docs), navega hasta [Tus integraciones](/developers/panel/app) en la pantalla superior derecha, y haz clic en la tarjeta correspondiente a la aplicación con la que estás desarrollando.
2. Habiendo accedido a “Datos de integración”, dirígete a la sección **Cuentas de prueba** en el menú lateral izquierdo.
3. En el menú seleccionador, haz clic en **Comprador**. Una vez allí, verás el **país de operación** de la cuenta, el **User ID**, el **usuario** y la **contraseña** de la cuenta de prueba.

![testuser](/images/snippets/test-cross/test-accounts-buyer-es.png)

> NOTE
>
> Si necesitas realizar pruebas para otro país, crea una [cuenta de prueba](/developers/es/docs/checkout-pro/additional-content/your-integrations/test/accounts) de tipo **Vendedor** y otra de tipo **Comprador**, asegurándote de seleccionar el país correspondiente al que deseas integrar.

---

# Realizar compras de prueba

Después de configurar su ambiente de pruebas, podrás realizar compras de prueba para validar la integración con el Checkout Pro y comprobar que los medios de pago configurados funcionen correctamente. A continuación, te mostraremos cómo realizar diferentes comprobaciones en tu integración.

> RED_MESSAGE
>
> Realiza las compras de prueba en una **pestaña de incógnito** de tu navegador para evitar errores por duplicidad de credenciales en el proceso.

## Probar una compra con tarjeta

Para probar una compra con tarjeta de crédito o débito, sigue el paso a paso:

1. Accede a [Mercado Pago Developers](/developers/es/docs) e inicia sesión como un **usuario de prueba de comprador** que creaste previamente. Para eso, utiliza el usuario y la contraseña asignados al mismo. Puedes consultar estos datos en la documentación [Prueba de integración > Crear cuenta de prueba comprador](/developers/es/docs/checkout-pro/integration-test).

> NOTE
>
> Si se solicita un código por e-mail al iniciar sesión, ingresa los **últimos 6 dígitos del User ID de la cuenta de prueba**, que puedes encontrar en **[Tus integraciones](/developers/panel/app) > _Tu aplicación_ > Cuentas de prueba**.

2. Inicializa el Checkout desde la preferencia de pago que creaste. Puedes encontrar las instrucciones de cómo inicializarlo en la documentación [Agregar el SDK al frontend e inicializar el checkout](/developers/es/docs/checkout-pro/web-integration/add-frontend-sdk).
3. **En un navegador de incógnito**, accede a la tienda en donde integraste Checkout Pro, selecciona algún producto o servicio y, en la instancia de pago, haz clic en el botón de compra de Mercado Pago.
4. Finalmente, realiza una compra de prueba utilizando los datos de **tarjetas de prueba** que se muestran a continuación. Ten en cuenta que puedes **simular diferentes resultados de compra** utilizando distintos nombres de titular en las tarjetas de pruebas.

### Tarjetas de prueba

Mercado Pago proporciona **tarjetas de prueba** que te permitirán probar pagos sin utilizar una tarjeta real.

Sus datos, como número, código de seguridad y fecha de caducidad, pueden ser combinados con los datos relativos al **titular de la tarjeta**, que te permitirán probar distintos escenarios de pago. Es decir, **puedes utilizar la información de cualquier tarjeta de prueba y probar resultados de pago diferentes a partir de los datos del titular**.

A continuación, puedes ver los datos de las **tarjetas de débito y crédito de prueba**. Selecciona aquella que quieras utilizar para probar tu integración.

| Tipo de tarjeta    |     Bandera      |       Número        | Código de seguridad | Fecha de caducidad |
| :----------------- | :--------------: | :-----------------: | :-----------------: | :----------------: |
| Tarjeta de crédito |    Mastercard    | 5416 7526 0258 2580 |         123         |       11/30        |
| Tarjeta de crédito |       Visa       | 4168 8188 4444 7115 |         123         |       11/30        |
| Tarjeta de crédito | American Express |  3757 781744 61804  |        1234         |       11/30        |
| Tarjeta de débito  |    Mastercard    | 5241 0198 2664 6950 |         123         |       11/30        |
| Tarjeta de débito  |       Visa       | 4023 6535 2391 4373 |         123         |       11/30        |

Luego, elige qué escenario de pago probar, y completa los campos del **titular de la tarjeta** (Nombre y apellido, Tipo y número de documento) según lo indica la tabla a continuación.

| Estado de pago                                              | Nombre y apellido del titular | Documento de identidad |
| ----------------------------------------------------------- | ----------------------------- | ---------------------- |
| Pago aprobado                                               | `APRO`                        | (otro) 123456789       |
| Rechazado por error general                                 | `OTHE`                        | (otro) 123456789       |
| Pendiente de pago                                           | `CONT`                        | -                      |
| Rechazado con validación para autorizar                     | `CALL`                        | -                      |
| Rechazado por importe insuficiente                          | `FUND`                        | -                      |
| Rechazado por código de seguridad inválido                  | `SECU`                        | -                      |
| Rechazado debido a un problema de fecha de vencimiento      | `EXPI`                        | -                      |
| Rechazado debido a un error de formulario                   | `FORM`                        | -                      |
| Rechazado por falta de card_number                          | `CARD`                        | -                      |
| Rechazado por cuotas invalidas                              | `INST`                        | -                      |
| Rechazado por pago duplicado                                | `DUPL`                        | -                      |
| Rechazado por tarjeta deshabilitada                         | `LOCK`                        | -                      |
| Rechazado por tipo de tarjeta no permitida                  | `CTNA`                        | -                      |
| Rechazado debido a intentos excedidos del pin de la tarjeta | `ATTE`                        | -                      |
| Rechazado por estar en lista negra                          | `BLAC`                        | -                      |
| No soportado                                                | `UNSU`                        | -                      |
| Usado para aplicar regla de montos                          | `TEST`                        | -                      |

Una vez que hayas completado todos los campos correctamente, haz clic en el botón para procesar el pago, y aguarda el resultado.

Si la prueba fue exitosa, verás la pantalla de éxito de la compra de prueba.

Si has configurado [notificaciones](/developers/es/docs/checkout-pro/payment-notifications), verifica que estás recibiendo las notificaciones correspondientes a la transacción de prueba.

---

# Salir a producción

Una vez finalizado el proceso de configuración y pruebas, tu integración estará lista para recibir pagos reales en producción.

A continuación, mira las recomendaciones necesarias para realizar este pasaje de manera eficaz y segura, garantizando que tu integración esté preparada para recibir transacciones reales.

:::AccordionComponent{title="Activar credenciales de producción" pill="1"}
Después de realizar las debidas [pruebas de tu integración](/developers/es/docs/checkout-api-payments/integration-test), **recuerda reemplazar las :toolTipComponent[credenciales]{link="/developers/es/docs/checkout-api-payments/resources/credentials" linkText="Credenciales" content="Claves de acceso únicas con las que identificamos una integración en tu cuenta, vinculadas a tu aplicación. Para más información, accede al link a continuación."} que utilizaste en la etapa de desarrollo por las de producción** para que puedas comenzar a operar en el entorno productivo de tu tienda y empezar a recibir pagos reales. Para ello, sigue los pasos a continuación para saber cómo **activarlas**.

1. Ingresa a [Tus integraciones](https://www.mercadopago[FAKER][URL][DOMAIN]/developers/panel/app) y selecciona una aplicación.
2. En la sección **Datos de integración**, dirígete a la sección **Credenciales** ubicado a la derecha de la pantalla y haz clic en **Productivas**. Haz clic en **Activar credenciales**. Alternativamente, puedes dirigirte a la sección **Credenciales de producción** en el menú lateral izquierdo.
3. En el campo **Industria**, selecciona del menú desplegable la industria o rubro a la que pertenece el negocio que estás integrando.
4. En el campo **Sitio web (obligatorio)**, completa con la URL del sitio web de tu negocio.
5. Acepta la y los [Términos y condiciones](/developers/es/docs/resources/legal/terms-and-conditions). Completa el reCAPTCHA y haz clic en **Activar credenciales de producción**.
   :::

:::AccordionComponent{title="Usar credenciales de producción" pill="2"}
Para salir a producción, deberás **colocar las credenciales de producción de tu aplicación de Mercado Pago** en tu integración.

Para hacerlo, ingresa a [Tus integraciones](/developers/panel/app), dirígete a la sección **Credenciales** ubicado a la derecha de la pantalla y haz clic en **Productivas**. Alternativamente, puedes acceder a **Producción > Credenciales de producción**.

Allí encontrarás tu **Public Key** y **Access Token** productivos, que deberás utilizar en lugar de los de la cuenta de prueba.

![Cómo acceder a las credenciales a través de Tus Integraciones](/images/snippets/credentials/app-data-production-credentials-es.png)

Para más información, consulta nuestra documentación de [Credenciales](/developers/es/docs/checkout-pro/additional-content/credentials).
:::

:::AccordionComponent{title="Implementar certificado SSL" pill="3"}
Para garantizar una integración segura que proteja los datos de cada transacción, es necesario implementar un certificado SSL (Secure Sockets Layer). Este certificado, junto con la utilización del protocolo HTTPS en la disponibilización de los medios de pago, asegura una conexión encriptada entre el cliente y el servidor.

Adoptar estas medidas no solo refuerza la seguridad de los datos de los usuarios, sino que también asegura el cumplimiento de las normativas y leyes específicas de cada país relacionadas con la protección de datos y la seguridad de la información. Además, contribuye significativamente a proporcionar una experiencia de compra más segura y confiable.

Aunque **la exigencia del certificado SSL no aplique durante el período de pruebas**, su implementación es obligatoria para entrar en producción.

Para más información, conoce los [Términos y Condiciones de Mercado Pago](/developers/es/docs/resources/legal/terms-and-conditions).
:::

:::AccordionComponent{title="Medir la calidad de tu integración" pill="Opcional"}
Una vez que hayas terminado de configurar tu integración, recomendamos que realices una **medición de calidad**, que es un proceso de certificación de tu integración, con el que podrás asegurar que tu desarrollo cuente con los requisitos de calidad necesarios para asegurar una mejor experiencia, así como una mayor tasa de aprobación de pagos.

Para conocer más, ve a la documentación [Cómo medir la calidad de tu integración](/developers/es/docs/checkout-pro/how-tos/integration-quality).
:::

---

# Cómo medir la calidad de tu integración

Para poder ofrecer tanto al vendedor como al comprador la mejor experiencia, Mercado Pago realiza una evaluación de tu integración teniendo en cuenta los estándares necesarios de seguridad y calidad.

A continuación, encontrarás toda la información necesaria para saber cómo se realiza esta medición, y así poder sacarle el máximo provecho a nuestra herramienta para mantener un proceso de mejora de calidad constante.

## ¿Qué es la medición de calidad?

La medición de calidad es un proceso de certificación de tu integración, con el que podrás asegurar que tu desarrollo cuente con los requisitos de calidad necesarios para dar tanto al vendedor como al comprador la mejor experiencia con Mercado Pago.

## ¿Qué aspectos evalúa la medición de calidad?

En el proceso de medición se analizan una serie de campos asociados a aspectos fundamentales con los que debe contar una integración de Mercado Pago, independientemente del producto integrado.

Puedes ver estos atributos evaluados y la importancia de cada uno a continuación:

| Aspectos                             | Descripción                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Experiencia de la persona que compra | Para crecer y mantener la tasa de usuarios en tu integración, debes poder ofrecer una buena experiencia de pago. Las sugerencias brindadas por Mercado Pago en la medición de calidad te guiarán para obtener los mejores resultados.                                                                                                     |
| Conciliación Financiera              | La consistencia en la verificación financiera de las transacciones registradas con Mercado Pago apunta a mantener la integridad de los datos en tu sistema, por lo que es importante que implementes las medidas necesarias y las buenas prácticas sugeridas en el resultado de tu medición.                                              |
| Aprobación de Pagos                  | Para garantizar una buena tasa de aprobación de pagos, es importante validar cada uno de los campos resaltados como mejoras necesarias, así como implementar las buenas prácticas sugeridas por Mercado Pago. De esta forma, le darás más elementos a nuestras herramientas de fraude para que puedan hacer una evaluación más detallada. |
| Escalabilidad                        | Al medir la calidad de tu integración, asegúrate de contar con las versiones más actualizadas de nuestras APIs y bibliotecas oficiales para obtener un mejor resultado.                                                                                                                                                                   |
| Seguridad                            | En Mercado Pago buscamos asegurar la confidencialidad de cada uno de los datos involucrados en un proceso de compra. Las mejoras indicadas o buenas prácticas sugeridas en el resultado de tu medición te permitirán obtener los datos necesarios de manera segura y confiable.                                                           |

## ¿Cómo medir la calidad de tu integración?

Dependiendo de la solución integrada, la evaluación de tu integración puede hacerse de dos maneras distintas: manual o automática.

> WARNING
>
> Importante
>
> En ambos casos, es requisito indispensable contar con un `payment ID` (identificador de pago) realizado con **credenciales de producción**, que permitirá la correcta evaluación del funcionamiento de la integración.

### Medición automática

Mercado Pago realiza una evaluación automática de todas las aplicaciones integradas con **Checkout Pro, Checkout Checkout Bricks y Mercado Pago Point** que cuenten con un `payment ID` productivo.

> NOTE
>
> Nota
>
> Las integraciones con **Código QR** no serán evaluadas de manera automática. Para conocer cómo medir la calidad de integración, dirígete a “Medición manual”, o bien a [Requisitos para salir a producción con Código QR](/developers/es/docs/qr-code/integration-test/attended-model/go-to-production). Por su parte, las integraciones con **Plugins y Plataformas** no podrán ser evaluadas de ninguna de las dos formas.

**El proceso de medición automática es llevado adelante mensualmente, incluso cuando hayas realizado por tu cuenta una medición manual previa**. Como a lo largo del tiempo, y en función de las mejoras aplicadas, las integraciones pueden presentar cambios en sus configuraciones, en Mercado Pago buscamos garantizar que tu trabajo con nuestras soluciones sea cada vez más satisfactorio, acercándote distintas opciones para lograr una calidad ideal.

Podrás encontrar los resultados de esta medición automática dentro de los [Detalles de la aplicación](/developers/es/docs/your-integrations/application-details). Al igual que con la medición manual, podrás visualizar el puntaje de tu aplicación, conocer las acciones indicadas como necesarias y buenas prácticas sugeridas. Para conocer más detalles, dirígete a [¿Cómo leer el resultado de tu evaluación?](/developers/es/docs/integration-quality#cmoleerelresultadodetuevaluacin)

### Medición manual

Si lo deseas, puedes realizar una evaluación manual de tu integración, siempre que cuentes con un `payment ID` de un pago productivo. Esto puede ser útil para integraciones nuevas, que estén realizando su salida a producción por fuera del período en el que Mercado Pago realiza su medición automática, o bien para aquellas integraciones que hayan aplicado mejoras señaladas y quieran verificar su impacto.

> WARNING
>
> Importante
>
> Recuerda que, incluso habiendo realizado una medición manual, Mercado Pago realizará una medición automática, excepto en integraciones con Código QR, que solo permiten evaluaciones manuales, y con Plugins y Plataformas, que no están habilitadas para ningún tipo de evaluación.

Para medir la calidad de tu integración de manera manual, ingresa al menú [Tus integraciones](/developers/panel/app). Allí, tendrás 2 opciones para acceder a la herramienta de medición:

- Puedes localizar la aplicación deseada y, desde el botón **“>”**, ingresar a la pantalla desde la que puedes realizar la evaluación de tu integración.
  ![Tus integraciones](/homologator/integration-quality-your-integrations-es.png)
- Puedes seleccionar la aplicación deseada y, desde los [Detalles de la aplicación](/developers/es/docs/your-integrations/application-details), hacer clic en **Iniciar medición** dentro del panel "Status", en caso de que se trate de una primera medición, o en **Medir de nuevo**, en caso de haber realizado una medición con anterioridad.
  ![Detalles de aplicación](/homologator/integration-quality-aplication-details-es.png)

Una vez dentro de la sección **“Medir calidad de tu integración"**, sigue los pasos a continuación.

1. Ingresa el `payment ID` del último pago productivo, realizado con [credenciales de producción](/developers/es/docs/your-integrations/credentials), de la aplicación que estás queriendo evaluar.
   ![homologación manual](/homologator/integration-quality-payment-id-es.png)

2. Finalmente, haz clic en **Medir la calidad**.

De esta manera, habrás realizado la medición de calidad de manera manual. Accede a [¿Cómo leer el resultado de tu evaluación?](/developers/es/docs/integration-quality#cmoleerelresultadodetuevaluacin) para saber cómo interpretarla y mantener tu integración alineada con los estándares de Mercado Pago.

## ¿Cómo leer el resultado de tu evaluación?

Ya sea que hayas realizado una medición de calidad manual, o hayas recibido los resultados de tu evaluación automática, encontrarás en los [Detalles de la aplicación](/developers/panel/app) la siguiente pantalla:

![resultados de medición](/homologator/integration-quality-results-es.png)

1. **Puntuación**: indica qué tan segura es la configuración de tu aplicación y si está en línea con las buenas prácticas de integración de Mercado Pago. El **puntaje mínimo** para que su aplicación cumpla con los requisitos es de **73**, pero **recomendamos obtener 100 puntos para mejorar la experiencia del usuario y aumentar la tasa de aprobación de pagos**.
2. **Fecha de última medición** y **payment ID**: indica el día y la hora de la última medición y el `payment ID` en el que se basa el puntaje de calidad de la aplicación.
3. **Aspectos evaluados**: indica qué puntaje fue obtenido para cada uno de los aspectos evaluados. Haz clic en ellos para poder saber qué oportunidades de mejora fueron identificadas en el proceso y cómo puedes abordarlas. Consulta la sección [¿Cómo mejorar la calidad de tu integración?](/developers/es/docs/integration-quality#cmomejorarlacalidaddetuintegracin) para explorar más posibilidades de optimización.
4. **Medir de nuevo**: una vez que hayas aplicado las oportunidades de mejora, tienes la opción de medir nuevamente la calidad de tu integración de manera manual o, si lo prefieres, aguardar a la medición automática mensual realizada por Mercado Pago.

## ¿Cómo mejorar la calidad de tu integración?

Como resultado de la medición de calidad de tu integración, nuestra herramienta te señalará distintos puntos que te permitirán optimizar su rendimiento y mejorar la experiencia tanto del vendedor como del comprador. Estos pueden ser:

- **Acciones obligatorias:** son requerimientos que deben ser cumplidos para asegurar la calidad de la integración y así sumar puntos de mejoría. Por ejemplo, activar las [notificaciones Webhooks](/developers/es/docs/your-integrations/notifications/webhooks) o enviar una referencia externa que permita hacer la correlación de pagos entre Mercado Pago y el sistema integrador.

- **Acciones recomendadas:** son tareas que ayudan a mejorar el puntaje de tu integración en la medición de calidad, pero no te impiden asegurarla. Un ejemplo de estas acciones puede ser enviar toda la información referida al comprador para mejorar la validación y seguridad de los pagos, y así disminuir las probabilidades de rechazos por parte de nuestro motor de prevención de fraude.

- **Buenas prácticas:** se trata de recomendaciones que, si bien no afectan el puntaje en la medición de calidad, sí aportan a mejorar determinados aspectos de tu integración. Por ejemplo, agregar los SDKs de MercadoPago.js V2 a tu proyecto, o bien mantener una actualización de tu sistema en función de los distintos eventos recibidos mediante notificaciones.

Las acciones y buenas prácticas sugeridas por Mercado Pago dependerán siempre de cada integración particular y, a su vez, de la solución integrada. Si bien aquí te proporcionamos información sobre algunas de ellas, deberás guiarte por la información devuelta por nuestra herramienta en el resultado de la medición de calidad para saber específicamente cómo optimizar el funcionamiento de tu integración y, consecuentemente, tu puntaje.

---

# ¿Por qué se rechaza un pago?

El rechazo de pagos es una realidad en el mundo de las ventas en línea y puede ocurrir por diversas razones. **Un pago puede ser rechazado por**:

- Un error con el medio de pago;
- Información incorrecta ingresada por el cliente;
- Tarjeta sin saldo suficiente;
- Violación de requisitos de seguridad necesarios;
- Movimientos sospechosos que indican riesgo de fraude;
- Problemas en la comunicación entre adquirentes y subadquirentes.

Puedes encontrar la **información y verificar el estado de un pago** vía API, a través del endpoint :TagComponent{tag="API" text="Obtener pago" href="/developers/es/reference/payments/\_payments_id/get"}. El campo `status` indica si el pago fue o no aprobado, mientras que el campo `status_detail` proporciona más detalles, incluyendo los motivos de rechazo.

```curl
{
    "status": "rejected",
    "status_detail": "cc_rejected_insufficient_amount",
    "id": 47198050,
    "payment_method_id": "master",
    "payment_type_id": "credit_card",
    ...
}
```

> SUCCESS_MESSAGE
>
> También puedes encontrar más información sobre pagos en la actividad de tu cuenta de [Mercado Pago](https://www.mercadopago[FAKER][URL][DOMAIN]/activities).

:::AccordionComponent{title="Rechazos debido a errores de ingreso"}
Estos motivos de rechazo ocurren debido a **errores durante el checkout**. Esto puede suceder por diversos motivos, como falta de comprensión de la pantalla de pago, problemas en la experiencia del comprador, falta de validación en los campos, o también errores que el comprador puede cometer al ingresar sus datos, principalmente los datos de la tarjeta.

En estos casos, el campo `status_detail` se devolverá como:

- `cc_rejected_bad_filled_card_number`
- `cc_rejected_bad_filled_date`
- `cc_rejected_bad_filled_other`
- `cc_rejected_bad_filled_security_code`

:::
:::AccordionComponent{title="Rechazos por el banco emisor"}
Al realizar un **pago con tarjeta de crédito o débito**, por ejemplo, el banco emisor puede rechazar el cargo por diferentes motivos, como fecha de vencimiento expirada, saldo o límite insuficiente, tarjeta deshabilitada o bloqueada para compras en línea.

En estos casos, el campo `status_detail` podrá devolver:

- `cc_rejected_call_for_authorize`
- `cc_rejected_card_disabled`
- `cc_rejected_duplicated_payment`
- `cc_rejected_insufficient_amount`
- `cc_rejected_invalid_installments`
- `cc_rejected_max_attempts`

:::
:::AccordionComponent{title="Rechazos por prevención de fraudes"}
Realizamos el seguimiento en tiempo real de las transacciones buscando **reconocer recursos y patrones sospechosos** que indiquen un intento de fraude. Esto lo hacen tanto los algoritmos de Mercado Pago como los bancos, todo para evitar al máximo los contracargos (_chargebacks_).

Cuando nuestro sistema de prevención de fraude detecta un pago sospechoso, el campo `status_detail` podrá devolver:

- `cc_rejected_blacklist`
- `cc_rejected_high_risk`
- `cc_rejected_other_reason`

La respuesta `cc_rejected_other_reason` es un status que proviene del banco emisor y, si bien no explicita el motivo de rechazo, se trata de una estimación de riesgo de fraude. Igualmente, hay otros motivos por los cuales este status puede ser devuelto. En caso de duda, es recomendable elegir otro medio de pago o ponerse en contacto con la entidad bancaria.

> WARNING
>
> En algunos casos, la respuesta `high_risk` puede ocurrir cuando se realizan dos pagos consecutivos con los mismos ítems o con parámetros muy similares (como valores en `payer` e `items` idénticos en ambos pagos realizados). Esto puede activar el motor antifraude, que puede interpretar el intento como duplicado y rechazarlo por precaución. Como consecuencia, los pagos subsiguientes pueden ser temporalmente bloqueados. Se recomienda implementar controles para evitar nuevos intentos inmediatos con los mismos datos de pago.

```json
 {
    "status": "rejected",
    "status_detail": "cc_rejected_high_risk",
    "id": 47198050,
    "payment_method_id": "master",
    "payment_type_id": "credit_card",
    ...
}
```

:::

---

# Cómo mejorar la aprobación de pagos

Para **evitar que un pago legítimo sea rechazado** por no cumplir con las validaciones de seguridad, necesitas incluir la mayor cantidad de información posible al realizar la operación y asegurarte de que tu checkout tenga una interfaz optimizada.

A continuación, conoce nuestras **recomendaciones para mejorar tu aprobación**.

:::::AccordionComponent{title="Obtener y enviar el Device ID"}
El **Device ID** es una información importante para garantizar una mejor seguridad y, por lo tanto, una mejor tasa de aprobación de pagos. Es un **identificador único para cada dispositivo del comprador** en el momento de la compra.

Si un comprador frecuente hace una compra desde un dispositivo diferente al que suele usar, esto puede verse como un comportamiento atípico. Aunque no necesariamente sea un fraude, el ID del dispositivo nos ayuda a afinar la evaluación y evitar que rechacemos pagos legítimos.

::::TabsComponent

:::TabComponent{title="Device ID en aplicaciones web"}
Para usar el Device ID en la web y evitar posibles compras fraudulentas, sigue estos pasos:

#### 1. Agrega el script de seguridad de Mercado Pago

> WARNING
>
> Si ya estás usando el [SDK JS de Mercado Pago](/developers/es/docs/sdks-library/client-side/mp-js-v2), **no** necesitas agregar el código de seguridad porque el Device ID se obtiene por defecto. En este caso, pasa directamente al paso de [uso del Device ID](/developers/es/docs/checkout-pro/how-tos/improve-payment-approval/recommendations#editor_4#bookmark_3._usa_el_device_id).

Para implementar la generación del Device ID en tu sitio, agrega este código en tu página de checkout:

```html
<script
  src="https://www.mercadopago.com/v2/security.js"
  view="checkout"
></script>
```

#### 2. Obtén el Device ID

Cuando hayas agregado el código de seguridad de Mercado Pago en tu sitio, se creará automáticamente una variable global de _Javascript_ llamada `MP_DEVICE_SESSION_ID`, que contiene el Device ID.

Si prefieres usar otra variable, puedes indicar el nombre agregando el atributo `output` al _script_ de seguridad, como en este ejemplo:

```html
<script
  src="https://www.mercadopago.com/v2/security.js"
  view="checkout"
  output="deviceId"
></script>
```

También puedes **crear tu propia variable**. Solo tienes que agregar una etiqueta `html` en tu sitio con el identificador `id="deviceID"`, así:

```html
<input type="hidden" id="deviceId" />
```

#### 3. Usa el Device ID

Una vez que tengas el valor de Device ID, necesitas **enviarlo a nuestros servidores** al crear un pago. Debes agregar este `header` a tu solicitud y reemplazar `device_id` por el nombre de la variable donde guardaste tu valor de Device ID.

```html
X-meli-session-id: device_id
```

:::
:::TabComponent{title="Device ID en aplicaciones móviles"}
Si tienes una aplicación móvil nativa, puedes capturar la información del dispositivo con nuestro SDK y enviarla cuando crees el _token_. Sigue estos pasos:

#### 1. Agrega la dependencia

Según el sistema operativo de tu aplicación móvil, agrega esta dependencia:

[[[

```ios
===
Pon este código en el archivo **Podfile**.
===
use_frameworks!
pod 'MercadoPagoDevicesSDK'
```

```android
===
Agrega el repositorio y la dependencia en el archivo **build.gradle**.
===
repositories {
    maven {
        url "https://artifacts.mercadolibre.com/repository/android-releases"
    }
}
dependencies {
   implementation 'com.mercadolibre.android.device:sdk:4.0.1'
}
```

]]]

#### 2. Inicializa el módulo

Después de agregar la dependencia, inicializa el módulo usando uno de estos lenguajes:

[[[

```swift
===
Te recomendamos inicializar el **AppDelegate** en el evento **didFinishLaunchingWithOptions**.
===
import MercadoPagoDevicesSDK
...
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        ...
        MercadoPagoDevicesSDK.shared.execute()
        ...
}
```

```objective-c
===
Te recomendamos inicializar el **AppDelegate** en el evento **didFinishLaunchingWithOptions**.
===
@import 'MercadoPagoDevicesSDK';
...
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    ...
    [[MercadoPagoDevicesSDK shared] execute];
    ...
}
```

```java
===
Te recomendamos inicializar en la clase **MainApplication**.
===
import com.mercadolibre.android.device.sdk.DeviceSDK;
DeviceSDK.getInstance().execute(this);
```

]]]

#### 3. Captura la información

Usa cualquiera de estas funciones para obtener la información en el formato que necesites:

[[[

```swift
MercadoPagoDevicesSDK.shared.getInfo() // Obtienes un objeto Device que es Codificable
MercadoPagoDevicesSDK.shared.getInfoAsJson() // Obtienes un objeto en JSON
MercadoPagoDevicesSDK.shared.getInfoAsJsonString() // Obtienes el JSON en formato de String
MercadoPagoDevicesSDK.shared.getInfoAsDictionary() // Obtienes un objeto Dictionary<String,Any>
```

```objective-c
[[[MercadoPagoDevicesSDK] shared] getInfoAsJson] // Obtienes un objeto en JSON
[[[MercadoPagoDevicesSDK] shared] getInfoAsJsonString] // Obtienes el JSON en formato de String
[[[MercadoPagoDevicesSDK] shared] getInfoAsDictionary] // Obtienes un objeto Dictionary<String,Any>
```

```java
Device device = DeviceSDK.getInstance().getInfo() // Obtienes un objeto Device, que es serializable
Map deviceMap = DeviceSDK.getInstance().getInfoAsMap()  // Obtienes un Map<String, Object>
String jsonString = DeviceSDK.getInstance().getInfoAsJsonString() // Obtienes una String en formato JSON
```

]]]

#### 4. Envía la información

Por último, envía la información que obtuviste en el campo `device` cuando crees el `card_token`.

```
{
  ...
  "device": {
    "fingerprint": {
      "os": "iOS",
      "system_version": "8.3",
      "ram": 18446744071562067968,
      "disk_space": 498876809216,
      "model": "MacBookPro9,2",
      "free_disk_space": 328918237184,
      "vendor_ids": [
        {
          "name": "vendor_id",
          "value": "C2508642-79CF-44E4-A205-284A4F4DE04C"
        },
        {
          "name": "uuid",
          "value": "AB28738B-8DC2-4EC2-B514-3ACF330482B6"
        }
      ],
      "vendor_specific_attributes": {
        "feature_flash": false,
        "can_make_phone_calls": false,
        "can_send_sms": false,
        "video_camera_available": true,
        "cpu_count": 4,
        "simulator": true,
        "device_languaje": "en",
        "device_idiom": "Phone",
        "platform": "x86_64",
        "device_name": "iPhone Simulator",
        "device_family": 4,
        "retina_display_capable": true,
        "feature_camera": false,
        "device_model": "iPhone Simulator",
        "feature_front_camera": false
      },
      "resolution": "375x667"
    }
  }
}
```

:::
::::

:::::

:::::AccordionComponent{title="Detallar todos los datos del pago"}
Para optimizar la validación de seguridad de los pagos y mejorar las aprobaciones, es importante que **envíes la mayor cantidad de datos posibles sobre el comprador y el producto**.

Fíjate en todos los atributos que puedes enviar al :TagComponent{tag="API" text="crear pago" href="/developers/es/reference/payments/\_payments/post"}, especialmente en la información adicional (`additional_info`), como los **datos del comprador**, los **detalles del producto** y la **información de envío**.

Para mejorar la eficiencia de nuestro motor de fraude, recomendamos enviar los **datos de industria** que correspondan al sector de tu negocio. Puedes ver más detalles sobre cada sector y los datos que te recomendamos incluir en la documentación de [Datos de industria](/developers/es/docs/checkout-pro/additional-settings/industry-data).
:::::

:::::AccordionComponent{title="Mejorar la calidad de tu integración"}
Antes de subir tu integración a un ambiente de producción, es necesario **verificar su calidad**, ya sea de forma manual o automática. Esto garantizará que la integración cumple con los estándares de calidad y seguridad de Mercado Pago y proporcionará acciones para mejorar la tasa de aprobación.

Para medir la calidad, es necesario realizar un proceso de certificación de tu integración. Consulta la documentación de [Cómo medir la calidad de la integración](/developers/es/docs/checkout-pro/how-tos/integration-quality).
:::::

:::::AccordionComponent{title="Aumentar la seguridad de tu tienda"}
Asegurar que tu tienda online cumpla con los principales protocolos de seguridad para transacciones en línea es necesario no solo para mejorar las tasas de aprobación de pagos, sino también para aumentar la confianza del consumidor.

Consulta algunas configuraciones recomendadas para reforzar esa confianza y proteger la información sensible de tus clientes durante el proceso de pago:

- **Certificado SSL:** El Secure Sockets Layer garantiza la encriptación de la información personal y financiera durante las transacciones, asegurando que todos los datos intercambiados entre el servidor y el cliente estén protegidos y evita filtraciones.
- **HTTPS:** El HyperText Transfer Protocol Secure es un indicador de seguridad para todos tus clientes y garantiza que toda la comunicación con la API de Mercado Pago se realice de forma segura.
- **Billetera de Mercado Pago:** Activar el pago a través de la billetera de Mercado Pago aporta una serie de beneficios tanto para la experiencia del usuario como para la gestión de riesgos. Como solo los usuarios logueados pueden utilizar esta opción, tenemos acceso a información más detallada sobre el pagador y el contexto de la transacción, lo que posibilita un análisis antifraude aún más eficiente gracias a la mayor cantidad de variables disponibles. Además, los pagos realizados con saldo en cuenta presentan tasas de aprobación significativamente superiores, ya que son operaciones internas dentro del ecosistema de Mercado Pago y no están sujetas a contracargos.
  :::::

:::::AccordionComponent{title="Mejorar la experiencia del usuario"}
En caso de que un pago sea rechazado, notificar al usuario sobre el motivo y destacar las alternativas disponibles es fundamental. En Checkout Pro, la experiencia es aún más sencilla, ya que el sistema ofrece intentos adicionales de pago, permitiendo que el cliente elija otra forma de completar la compra. Este enfoque no solo ayuda a resolver el inconveniente, sino que también demuestra atención y cercanía en el servicio al cliente.
:::::

:::::AccordionComponent{title="Ofrecer soporte a tus clientes"}
Brindar al cliente una tienda optimizada contribuirá al éxito de las operaciones. Para ello, es importante garantizar que tu equipo tenga un profundo entendimiento del sistema y sus configuraciones. Este conocimiento permitirá la rápida resolución de problemas y un mejor servicio a las diferentes necesidades de los clientes.
Esto incluye **proporcionar canales de soporte accesibles y eficientes** para ayudar a los usuarios que enfrenten dificultades durante el proceso de pago. Esto puede hacerse a través de chat en vivo, correo electrónico o teléfono.
:::::

:::::AccordionComponent{title="Implemente un mecanismo de verificación de identidad"}
Se recomienda implementar mecanismos avanzados de seguridad para proteger las transacciones en línea. La autenticación 3DS 2.0, por ejemplo, añade una capa extra de protección al permitir que el propio usuario valide su identidad en el momento del pago, reduciendo significativamente el riesgo de fraudes.
Para más detalles sobre cómo integrar o activar el 3DS 2.0 en Checkout Pro, ponte en contacto con el equipo comercial.
:::::

---

# Datos de industria

De acuerdo con el ramo de actividades o sector de tu tienda, puedes incluir información adicional al momento de crear el pago que ayuda a aumentar las posibilidades de aprobación.

A continuación, encontrarás algunos datos específicos para estas industrias que puedes agregar a tu integración.

:::AccordionComponent{title="Indumentaria"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `type`        | _String_  | Tipo            |
| `description` | _String_  | Descripción     |
| `picture_url` | _String_  | URL de imagen   |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                           |
| ------------------ | --------- | ------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.     |
| `zip_code`         | _String_  | Código postal                         |
| `state_name`       | _String_  | Provincia                             |
| `city_name`        | _String_  | Ciudad                                |
| `street_number`    | _Integer_ | Número de calle                       |
| `express_shipment` | _Boolean_ | `True` si lo es, `False` si no lo es. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "type": "test",
            "category_id": "fashion",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "first_name": "[FAKER][NAME][FIRST_NAME]",
        "last_name": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        },
        "express_shipment": false
    }
}'
```

:::
:::AccordionComponent{title="Electro"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción                                                   |
| ------------- | --------- | ------------------------------------------------------------- |
| `id`          | _String_  | Código                                                        |
| `title`       | _String_  | Nombre                                                        |
| `category_id` | _String_  | Categoría                                                     |
| `quantity`    | _Integer_ | Cantidad                                                      |
| `unit_price`  | _Float_   | Precio unitario                                               |
| `warranty`    | _Boolean_ | `True` si el producto tiene garantía, `False` si no la tiene. |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                                         |
| ------------------ | --------- | --------------------------------------------------- |
| `local_pickup`     | _Boolean_ | `True` si retira en sucursal, `False` si no lo hace |
| `receiver_address` | _Object_  | Datos de dirección del comprador.                   |
| `zip_code`         | _String_  | Código postal                                       |
| `state_name`       | _String_  | Provincia                                           |
| `city_name`        | _String_  | Ciudad                                              |
| `street_number`    | _Integer_ | Número de calle                                     |
| `express_shipment` | _Boolean_ | `True` si lo es, `False` si no lo es.               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "category_id": "phones",
            "quantity": 1,
            "unit_price": 150,
            "warranty": false,
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com”,
        "first_name": "[FAKER][NAME][FIRST_NAME]",
        "last_name": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        },
        "express_shipment": false,
        "local_pickup": false
    }
}'
```

:::
:::AccordionComponent{title="Tickets y entretenimiento"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items`         | Tipo      | Descripción                                                                                                                        |
| --------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | _String_  | Código                                                                                                                             |
| `title`               | _String_  | Nombre                                                                                                                             |
| `category_id`         | _String_  | Categoría                                                                                                                          |
| `quantity`            | _Integer_ | Cantidad                                                                                                                           |
| `unit_price`          | _Float_   | Precio unitario                                                                                                                    |
| `category_descriptor` | _Object_  | Descripción de la categoría                                                                                                        |
| `event_date`          | _Date_    | Fecha del evento. Debe enviarse dentro del objeto `category_descriptor`. Debe enviarse en formato ISO 8601 (fecha y hora, en UTC). |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                           |
| ------------------ | --------- | ------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.     |
| `zip_code`         | _String_  | Código postal                         |
| `state_name`       | _String_  | Provincia                             |
| `city_name`        | _String_  | Ciudad                                |
| `street_number`    | _Integer_ | Número de calle                       |
| `express_shipment` | _Boolean_ | `True` si lo es, `False` si no lo es. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "category_id": "entertainment",
            "quantity": 1,
            "unit_price": 150,
            "category_descriptor":{
                "event_date": "2022-03-12T12:58:41.425-04:00"
            },
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "first_name": "[FAKER][NAME][FIRST_NAME]",
        "last_name": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        },
        "express_shipment": false,
        "local_pickup": false
    }
}'
```

:::
:::AccordionComponent{title="Casa y decoración"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción                                                   |
| ------------- | --------- | ------------------------------------------------------------- |
| `id`          | _String_  | Código                                                        |
| `title`       | _String_  | Nombre                                                        |
| `description` | _String_  | Descripción                                                   |
| `category_id` | _String_  | Categoría                                                     |
| `quantity`    | _Integer_ | Cantidad                                                      |
| `unit_price`  | _Float_   | Precio unitario                                               |
| `warranty`    | _Boolean_ | `True` si el producto tiene garantía, `False` si no la tiene. |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                           |
| ------------------ | --------- | ------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.     |
| `zip_code`         | _String_  | Código postal                         |
| `state_name`       | _String_  | Provincia                             |
| `city_name`        | _String_  | Ciudad                                |
| `street_number`    | _Integer_ | Número de calle                       |
| `express_shipment` | _Boolean_ | `True` si lo es, `False` si no lo es. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "home",
            "quantity": 1,
            "unit_price": 150,
            "warranty": false,
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "first_name": "[FAKER][NAME][FIRST_NAME]",
        "last_name": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        },
        "express_shipment": false,
        "local_pickup": false
    }
}'
```

:::
:::AccordionComponent{title="Aplicaciones y plataformas online"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "services",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::
:::AccordionComponent{title="Retail"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `description` | _String_  | Descripción     |
| `picture_url` | _String_  | URL de imagen   |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                           |
| ------------------ | --------- | ------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.     |
| `zip_code`         | _String_  | Código postal                         |
| `state_name`       | _String_  | Provincia                             |
| `city_name`        | _String_  | Ciudad                                |
| `street_number`    | _Integer_ | Número de calle                       |
| `express_shipment` | _Boolean_ | `True` si lo es, `False` si no lo es. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/us/home/failure",
        "pending": "https://www.mercadopago.com/us/home/pending",
        "success": "https://www.mercadopago.com/us/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "others",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        },
        "express_shipment": false,
        "local_pickup": false
    }
}'
```

:::
:::AccordionComponent{title="Servicios gubernamentales y públicos"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items`         | Tipo      | Descripción                 |
| --------------------- | --------- | --------------------------- |
| `id`                  | _String_  | Código                      |
| `title`               | _String_  | Nombre                      |
| `description`         | _String_  | Descripción                 |
| `category_id`         | _String_  | Categoría                   |
| `quantity`            | _Integer_ | Cantidad                    |
| `unit_price`          | _Float_   | Precio unitario             |
| `category_descriptor` | _Object_  | Descripción de la categoría |
| `event_date`          | _Date_    | Fecha del evento            |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                       |
| ------------------ | --------- | --------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador. |
| `zip_code`         | _String_  | Código postal                     |
| `state_name`       | _String_  | Provincia                         |
| `city_name`        | _String_  | Ciudad                            |
| `street_number`    | _Integer_ | Número de calle                   |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Servicio",
            "picture_url": "",
            "description": "Descripción de servicio",
            "category_id": "services",
            "quantity": 1,
            "unit_price": 150,
            "category_descriptor":{
                "event_date": "2022-03-12T12:58:41.425-04:00"
            },
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
        }
    }
}'
```

:::
:::AccordionComponent{title="Turismo"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items`           | Tipo      | Descripción                                              |
| ----------------------- | --------- | -------------------------------------------------------- |
| `id`                    | _String_  | Código                                                   |
| `title`                 | _String_  | Nombre                                                   |
| `description`           | _String_  | Descripción                                              |
| `category_id`           | _String_  | Categoría                                                |
| `quantity`              | _Integer_ | Cantidad                                                 |
| `unit_price`            | _Float_   | Precio unitario                                          |
| `category_descriptor`   | _Object_  | Descripción de la categoría.                             |
| `passenger`             | _Object_  | Información adicional del pasajero.                      |
| `first_name`            | _String_  | Nombre                                                   |
| `last_name`             | _String_  | Apellido                                                 |
| `identification_type`   | _String_  | Tipo de identificación                                   |
| `identification_number` | _String_  | Número de identificación                                 |
| `route`                 | _Object_  | Información de la ruta                                   |
| `departure`             | _String_  | Salida                                                   |
| `destination`           | _String_  | Llegada                                                  |
| `departure_date_time`   | _Date_    | Fecha de salida. Ejemplo: 2024-06-20T06:20:00.000-04:00. |
| `arrival_date_time`     | _Date_    | Fecha de llegada                                         |
| `company`               | _String_  | Compañía                                                 |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Servicio",
            "description": "Descripción de servicio",
            "category_id": "Travels",
            "category_descriptor":{
             "passenger": {
                 "first_name": "[FAKER][NAME][FIRST_NAME]",
                  "last_name": "[FAKER][NAME][LAST_NAME]",
                   "type": "[FAKER][IDENTIFICATION][TYPE]",
                   "number": 12345678
              },
              "route": {
                 "departure": "[FAKER][ADDRESS][CITY]",
                 "destination": "Londres",
                 "departure_date_time": "2022-03-12T12:58:41.425-04:00",
                 "arrival_date_time": "2022-03-14T12:58:41.425-04:00",
                 "company": "Compañía"
            }
},
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::
:::AccordionComponent{title="Hospitalidad"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items`           | Tipo      | Descripción                         |
| ----------------------- | --------- | ----------------------------------- |
| `id`                    | _String_  | Código                              |
| `title`                 | _String_  | Nombre                              |
| `category_id`           | _String_  | Categoría                           |
| `quantity`              | _Integer_ | Cantidad                            |
| `unit_price`            | _Float_   | Precio unitario                     |
| `event_date`            | _Date_    | Fecha del evento                    |
| `category_descriptor`   | _Object_  | Descripción de la categoría.        |
| `passenger`             | _Object_  | Información adicional del pasajero. |
| `first_name`            | _String_  | Nombre                              |
| `last_name`             | _String_  | Apellido                            |
| `identification_type`   | _String_  | Tipo de identificación              |
| `identification_number` | _String_  | Número de identificación            |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Servicio",
            "description": "Descripción de servicio",
            "category_id": "Travels",
            "category_descriptor": {
                "event_date": "2020-06-02T12:58:41.425-04:00",
                "passenger": {
                    "first_name": "[FAKER][NAME][FIRST_NAME]",
                    "last_name": "[FAKER][NAME][LAST_NAME]",
                    "type": "[FAKER][IDENTIFICATION][TYPE]",
                    "number": 12345678
                }
            },
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::
:::AccordionComponent{title="Utilidades"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "category_id": "others",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::
:::AccordionComponent{title="Venta directa"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `description` | _String_  | Descripción     |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                                             |
| ------------------ | --------- | ------------------------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.                       |
| `zip_code`         | _String_  | Código postal                                           |
| `state_name`       | _String_  | Provincia                                               |
| `city_name`        | _String_  | Ciudad                                                  |
| `street_number`    | _Integer_ | Número de calle                                         |
| `floor`            | _String_  | Piso                                                    |
| `apartment`        | _String_  | Apartamento                                             |
| `local_pickup`     | _Boolean_ | `True` si se retira en sucursal, `False` si no lo hace. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "others",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_prime_user": false,
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "local_pickup": false,
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
            "floor": "12",
            "apartment": "B"
        }
    }
}'
```

:::
:::AccordionComponent{title="Automóviles y náutica"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `description` | _String_  | Descripción     |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

- Entregas (_object_ `shipment`)

| Object `shipment`  | Tipo      | Descripción                                             |
| ------------------ | --------- | ------------------------------------------------------- |
| `receiver_address` | _Object_  | Datos de dirección del comprador.                       |
| `zip_code`         | _String_  | Código postal                                           |
| `state_name`       | _String_  | Provincia                                               |
| `city_name`        | _String_  | Ciudad                                                  |
| `street_number`    | _Integer_ | Número de calle                                         |
| `floor`            | _String_  | Piso                                                    |
| `apartment`        | _String_  | Apartamento                                             |
| `local_pickup`     | _Boolean_ | `True` si se retira en sucursal, `False` si no lo hace. |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "others",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_first_purchase_online": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    },
    "shipments": {
        "mode": "not_specified",
        "local_pickup": false,
        "receiver_address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "city_name": "[FAKER][ADDRESS][CITY]",
            "state_name": "[FAKER][ADDRESS][STATE]",
            "street_number": 1000
            "floor": "12",
            "apartment": "B"
        }
    }
}'
```

:::
:::AccordionComponent{title="Transporte urbano"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción     |
| ------------- | --------- | --------------- |
| `id`          | _String_  | Código          |
| `title`       | _String_  | Nombre          |
| `description` | _String_  | Descripción     |
| `category_id` | _String_  | Categoría       |
| `quantity`    | _Integer_ | Cantidad        |
| `unit_price`  | _Float_   | Precio unitario |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                          |
| -------------------------- | --------- | -------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre                                                               |
| `last_name`                | _String_  | Apellido                                                             |
| `identification`           | _Object_  | Datos de identificación                                              |
| `identification_type`      | _String_  | Tipo de identificación                                               |
| `identification_number`    | _String_  | Número de identificación                                             |
| `phone`                    | _Object_  | Teléfono                                                             |
| `area_code`                | _Integer_ | Código de área                                                       |
| `number`                   | _Integer_ | Número de teléfono                                                   |
| `address`                  | _Object_  | Datos de dirección                                                   |
| `zip_code`                 | _String_  | Código postal                                                        |
| `street_name`              | _String_  | Nombre de calle                                                      |
| `street_number`            | _Integer_ | Número de calle                                                      |
| `authentication_type`      | _Enum_    | Tipo de autenticación ("Gmail" - "Facebook" - "Web Nativa" - "Otro") |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                         |
| `is_prime_user`            | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `is_first_purchase_online` | _Boolean_ | `True` si lo es, `False` si no lo es.                                |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                               |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location --request POST 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2025-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "[FAKER][CURRENCY][ACRONYM]",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "others",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "[FAKER][PHONE_NUMBER][CELL_PHONE]"
        },
        "address": {
            "zip_code": "[FAKER][ADDRESS][ZIP_CODE]",
            "street_name": "[FAKER][ADDRESS][STREET_NAME]",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "[FAKER][IDENTIFICATION][TYPE]",
          "identification_number": "12345678"
        },
        "email": "john@yourdomain.com",
        "name": "[FAKER][NAME][FIRST_NAME]",
        "surname": "[FAKER][NAME][LAST_NAME]",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_first_purchase_online": false,
        "is_prime_user": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::

:::AccordionComponent{title="Apuestas"}
Agrega cualquier información extra que consideres necesaria sobre:

- Ítems (_array_ `items`)

| Array `items` | Tipo      | Descripción                                                  |
| ------------- | --------- | ------------------------------------------------------------ |
| `id`          | _String_  | Código de identificación del ítem.                           |
| `title`       | _String_  | Nombre del ítem.                                             |
| `warranty`    | _Boolean_ | `true` si lo es, `false` si no lo es.                        |
| `category_id` | _String_  | Categoría del ítem.                                          |
| `quantity`    | _Integer_ | Cantidad de unidades para el ítem.                           |
| `unit_price`  | _Float_   | Precio unitario asignado al ítem. Debe ser un número entero. |

- Comprador (_object_ `payer`)

| Object `payer`             | Tipo      | Descripción                                                                               |
| -------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `first_name`               | _String_  | Nombre del comprador.                                                                     |
| `last_name`                | _String_  | Apellido del comprador.                                                                   |
| `identification`           | _Object_  | Datos de identificación del comprador.                                                    |
| `type`                     | _String_  | Tipo de identificación. Se encuentra dentro del objeto `identification`.                  |
| `number`                   | _String_  | Número de identificación. Se encuentra dentro del objeto `identification`.                |
| `phone`                    | _Object_  | Teléfono del comprador.                                                                   |
| `area_code`                | _Integer_ | Código de área del comprador. Se encuentra dentro del objeto `phone`.                     |
| `number`                   | _Integer_ | Número de teléfono del comprador. Se encuentra dentro del objeto `phone`.                 |
| `address`                  | _Object_  | Datos del domicilio del comprador.                                                        |
| `zip_code`                 | _String_  | Código postal del comprador. Se encuentra dentro del objeto `address`.                    |
| `street_name`              | _String_  | Nombre de calle del domicilio del comprador. Se encuentra dentro del objeto `address`.    |
| `street_number`            | _Integer_ | Número de calle del domicilio del comprador. Se encuentra dentro del objeto `address`.    |
| `authentication_type`      | _Enum_    | Tipo de autenticación. Pueden ser "Gmail", "Facebook", "Web Nativa" u "Otro".             |
| `registration_date`        | _Date_    | Fecha de registro del comprador en el sitio.                                              |
| `is_prime_user`            | _Boolean_ | Indica si el usuario es premium. Coloca `true` si lo es o `false` si no lo es.            |
| `is_first_purchase_online` | _Boolean_ | Indica si es la primera compra del cliente. Coloca `true` si lo es o `false` si no lo es. |
| `last_purchase`            | _Date_    | Fecha de la última compra en el sitio.                                                    |

A continuación, encontrarás un ejemplo de cómo enviar los datos presentados en las tablas anteriores:

```curl
curl --location 'https://api.mercadopago.com/checkout/preferences' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{access_token}}' \
--data-raw '{
    "auto_return": "approved",
    "back_urls": {
        "failure": "https://www.mercadopago.com/home/failure",
        "pending": "https://www.mercadopago.com/home/pending",
        "success": "https://www.mercadopago.com/home/success"
    },
    "notification_url": "https://webhook.site/xyz",
    "expires": false,
    "external_reference": "order-123",
    "date_of_expiration": "2026-03-12T12:58:41.425-04:00",
    "items": [
        {
            "id": "1234",
            "currency_id": "MXN",
            "title": "Producto",
            "picture_url": "",
            "description": "Descripción de producto",
            "category_id": "lottery",
            "quantity": 1,
            "unit_price": 150
        }
    ],
    "payer": {
        "phone": {
            "area_code": "11",
            "number": "619 911 306"
        },
        "address": {
            "zip_code": "52",
            "street_name": "Insurgentes Sur",
            "street_number": 1000
        },
        "identification": {
          "identification_type": "-",
          "identification_number": "12345678"
        },
        "email": "carlota.castellanos@yourdomain.com",
        "name": "Carlota",
        "surname": "Castellanos",
        "date_created": "",
        "authentication_type": "Facebook",
        "registration date": "2015-06-02T12:58:41.425-04:00",
        "is_first_purchase_online": false,
        "is_prime_user": false,
        "last_purchase": "2020-01-02T12:58:41.425-04:00"
    },
    "payment_methods": {
        "excluded_payment_methods": [
            {
                "id": ""
            }
        ],
        "default_installments": null,
        "default_payment_method_id": null,
        "excluded_payment_types": [
            {
                "id": ""
            }
        ],
        "installments": null
    }
}'
```

:::

---

# Cómo integrar el checkout en marketplace

Marketplace es un sitio/plataforma de comercio electrónico que conecta a vendedores y compradores en un mismo entorno de ventas, permitiendo la venta de productos y/o servicios online con mayor alcance y posibilidad de conversión.

Además de la estructura necesaria para realizar las ventas, algunos _marketplaces_ se encargan de la disposición de productos, formas de pago y envío, optimizando el proceso de venta y facilitando la gestión comercial.

Si eliges vender a través de un _marketplace_, es posible integrar **dos tipos de checkout de Mercado Pago** para procesar los pagos realizados.

- [Checkout Pro](/developers/es/guides/checkout-pro/landing): en este modelo de checkout, el comprador es dirigido a una página de Mercado Pago para completar el pago.
- : este modelo de pago permite al comprador realizar el pago dentro del entorno del _marketplace_.

Ambos checkouts reparten automáticamente los importes entre el vendedor y el _marketplace_ a través del _split del pago_ sin necesidad de ninguna acción por parte del vendedor.

> NOTE
>
> La comisión de Mercado Pago se descuenta de los fondos recibidos por el vendedor. Es decir, primero se descuenta la comisión de Mercado Pago, y la comisión del marketplace se descuenta del saldo restante.

Para realizar la integración deberás seguir el flujo de integración habitual del _checkout_ elegido, utilizando necesariamente el token de acceso para cada vendedor que fue obtenido a través de OAuth. A continuación, enumeramos los pasos necesarios para integrar una caja con el _marketplace_.

1. Sigue los pasos descritos en la [documentación de OAuth](/developers/es/docs/security/oauth) para obtener cada `access_token` y `public_key`. Esta información será necesaria durante el proceso de integración de pago en el _marketplace_.
2. Elige el checkout que deseas ([Checkout Pro](/developers/es/guides/checkout-pro/landing) o ) y sigue todo el flujo de integración.
3. En la integración del _checkout_, usa la `public_key` y el `access_token` del vendedor (obtenidos en el paso 1) en el _backend_ o en el _header_ de la solicitud.
4. Para determinar el porcentaje de comisión del marketplace:

- Si es Checkout Pro, completa el parámetro `marketplace_fee` con el monto que se cobrará por cada preferencia de pago creada en la API **/checkout/preferences**.

<br>

#### Ejemplo

```json
{
  "items": [
    {
      "id": "item-ID-1234",
      "title": "Mi producto",
      "currency_id": "ARS",
      "quantity": 1,
      "unit_price": 75
    }
  ],
  "marketplace_fee": 10
}
```

- Si es Checkout , completa el parámetro `application_fee` con el monto que se cobrará por cada pago creado en la API **/payments**.

<br>

#### Ejemplo

```curl
curl --location 'https://api.mercadopago.com/v1/payments' \
--header 'accept: application/json' \
--header 'content-type: application/json' \
--header 'Authorization: Bearer {{oauth_access_token}}' \
--data-raw '{
    "description": "Pago de prueba 3",
    "installments": 1,
    "token": "{{card_token}}",
    "payer": {
        "email": "{{payer_email}}"
    },
    "payment_method_id": "master",
    "transaction_amount": 25,
    "application_fee": 10
}'
```

Al completar estos pasos, el checkout se habrá integrado en el _marketplace_ y estará listo para procesar pagos.

---
