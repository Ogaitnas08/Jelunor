const formulario =
    document.getElementById("loginForm");

const mensaje =
    document.getElementById("mensaje");

const boton =
    document.getElementById("loginButton");


formulario.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        mensaje.textContent = "";
        mensaje.className = "mensaje";

        const correo =
            document.getElementById("correo").value;

        const password =
            document.getElementById("password").value;


        boton.disabled = true;
        boton.textContent = "Ingresando...";


        try {

            const respuesta = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        correo,
                        password
                    })
                }
            );


            const datos =
                await respuesta.json();


            if (!respuesta.ok) {

                mensaje.textContent =
                    datos.mensaje;

                mensaje.classList.add("error");

                return;
            }


            mensaje.textContent =
                "Inicio de sesión correcto.";

            mensaje.classList.add("success");


            setTimeout(() => {

                window.location.href = "/";

            }, 700);


        } catch (error) {

            console.error(error);

            mensaje.textContent =
                "No se pudo conectar con Jelunor.";

            mensaje.classList.add("error");

        } finally {

            boton.disabled = false;
            boton.textContent = "Iniciar sesión";

        }

    }
);