const formulario =
    document.getElementById("registroForm");

const mensaje =
    document.getElementById("mensaje");

const boton =
    document.getElementById("registroButton");


formulario.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        mensaje.textContent = "";
        mensaje.className = "mensaje";


        const nombre =
            document.getElementById("nombre").value;

        const documento =
            document.getElementById("documento").value;

        const correo =
            document.getElementById("correo").value;

        const telefono =
            document.getElementById("telefono").value;

        const password =
            document.getElementById("password").value;

        const confirmarPassword =
            document.getElementById(
                "confirmarPassword"
            ).value;


        if (
            password !== confirmarPassword
        ) {

            mensaje.textContent =
                "Las contraseñas no coinciden.";

            mensaje.classList.add("error");

            return;

        }


        boton.disabled = true;
        boton.textContent = "Creando cuenta...";


        try {

            const respuesta = await fetch(
                "/api/auth/registro",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        nombre,
                        documento,
                        correo,
                        telefono,
                        password,
                        confirmarPassword

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
                "Cuenta creada correctamente.";

            mensaje.classList.add("success");


            formulario.reset();


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1500);


        } catch (error) {

            console.error(error);

            mensaje.textContent =
                "No se pudo conectar con Jelunor.";

            mensaje.classList.add("error");


        } finally {

            boton.disabled = false;

            boton.textContent =
                "Crear cuenta";

        }

    }
);