// Variable global para almacenar los datos de regiones y comunas
let regionesComunasData = [];

// Función para cargar las regiones y comunas desde el archivo JSON
async function cargarRegionesYComunas() {
    console.log('Iniciando carga de regiones y comunas...');
    try {
        // Cargar datos si no están en memoria
        if (regionesComunasData.length === 0) {
            console.log('Cargando datos de regiones y comunas...');
            const response = await fetch('assets/regionesycomunas.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de regiones y comunas');
            }
            regionesComunasData = await response.json();
            console.log('Datos de regiones y comunas cargados:', regionesComunasData.length, 'registros');
        }
        
        const selectRegion = document.getElementById('region');
        if (!selectRegion) {
            console.error('No se encontró el elemento select de región');
            return false;
        }
        
        // Obtener regiones únicas
        const regionesUnicas = [...new Set(regionesComunasData.map(item => item['Región']))];
        console.log('Regiones encontradas:', regionesUnicas.length);
        
        // Guardar la selección actual
        const regionSeleccionada = selectRegion.value;
        
        // Limpiar opciones existentes
        $(selectRegion).empty().append(new Option('Seleccione una región', ''));
        
        // Agregar regiones al select
        regionesUnicas.forEach(region => {
            const option = new Option(region, region);
            selectRegion.add(option);
        });
        
        // Restaurar la selección anterior si existe
        if (regionSeleccionada && regionesUnicas.includes(regionSeleccionada)) {
            selectRegion.value = regionSeleccionada;
        }
        
        // Forzar actualización de Select2
        $(selectRegion).trigger('change.select2');
        
        console.log('Regiones cargadas en el select:', selectRegion.options.length);
        
        // Si hay una región seleccionada, actualizar las comunas
        if (selectRegion.value) {
            console.log('Actualizando comunas para región:', selectRegion.value);
            actualizarComunas(selectRegion.value);
        } else {
            // Limpiar comunas si no hay región seleccionada
            const selectComuna = document.getElementById('comuna');
            if (selectComuna) {
                selectComuna.disabled = true;
                $(selectComuna).val(null).trigger('change');
                
                // Limpiar opciones excepto la primera
                while (selectComuna.options.length > 1) {
                    selectComuna.remove(1);
                }
            }
        }
        
        console.log('Regiones cargadas correctamente');
        return true;
    } catch (error) {
        console.error('Error al cargar regiones y comunas:', error);
        return false;
    }
}

// Función para actualizar las comunas según la región seleccionada
function actualizarComunas(regionSeleccionada) {
    console.log('Actualizando comunas para región:', regionSeleccionada);
    const selectComuna = document.getElementById('comuna');
    if (!selectComuna) {
        console.error('No se encontró el elemento select de comuna');
        return;
    }
    
    // Limpiar opciones existentes
    $(selectComuna).empty().append(new Option('Seleccione una comuna', ''));
    
    // Si no hay región seleccionada, deshabilitar comuna y salir
    if (!regionSeleccionada) {
        console.log('No hay región seleccionada, deshabilitando comuna');
        selectComuna.disabled = true;
        $(selectComuna).prop('disabled', true).val(null).trigger('change');
        return;
    }
    
    // Filtrar comunas por región seleccionada
    const comunasDeRegion = regionesComunasData
        .filter(item => item['Región'] === regionSeleccionada)
        .map(item => item['Comuna']);
    
    console.log('Comunas encontradas para', regionSeleccionada + ':', comunasDeRegion.length);
    
    // Si no hay comunas para la región, deshabilitar y salir
    if (comunasDeRegion.length === 0) {
        console.log('No se encontraron comunas para la región seleccionada');
        selectComuna.disabled = true;
        $(selectComuna).prop('disabled', true).val(null).trigger('change');
        return;
    }
    
    // Agregar comunas al select
    comunasDeRegion.forEach(comuna => {
        const option = new Option(comuna, comuna);
        selectComuna.add(option);
    });
    
    // Habilitar el select de comuna
    selectComuna.disabled = false;
    $(selectComuna).prop('disabled', false).trigger('change');
    
    console.log('Comunas cargadas en el select:', selectComuna.options.length);
    
    // Forzar actualización de Select2
    $(selectComuna).trigger('change.select2');
}

// Función para cargar las nacionalidades desde el archivo JSON y poblar los selects de país
async function cargarNacionalidades() {
    try {
        const response = await fetch('assets/paises.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de nacionalidades');
        }
        const paises = await response.json();
        const selectNacionalidad = document.getElementById('nacionalidad');
        const selectPaisResidencia = document.getElementById('paisResidencia');
        
        // Ordenar países alfabéticamente
        paises.sort((a, b) => a.País.localeCompare(b.País));
        
        // Función para agregar opciones a un select
        function poblarSelect(selectElement) {
            // Limpiar opciones existentes excepto la primera
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            // Agregar cada país al select
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.value = pais.País; // Guardar el nombre completo del país
                option.textContent = pais.País;
                selectElement.appendChild(option);
            });
            
            // Inicializar/actualizar Select2
            $(selectElement).trigger('change.select2');
        }
        
        // Poblar ambos selects
        poblarSelect(selectNacionalidad);
        poblarSelect(selectPaisResidencia);
        
        // Configurar la visibilidad condicional después de cargar las nacionalidades
        configurarVisibilidadCondicional();
    } catch (error) {
        console.error('Error al cargar las nacionalidades:', error);
        // Mostrar mensaje de error al usuario
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'No se pudieron cargar las nacionalidades. Por favor, recargue la página.';
        document.querySelector('.form-container').prepend(errorDiv);
    }
}

// Función para configurar la visibilidad condicional de los campos de documento
function configurarVisibilidadCondicional() {
    const nacionalidadSelect = document.getElementById('nacionalidad');
    const tipoDocumentoSelect = document.getElementById('tipoDocumento');
    const tipoDocumentoContainer = document.getElementById('tipoDocumentoContainer');
    const idOrigenContainer = document.getElementById('idOrigenContainer');
    const runContainer = document.getElementById('runContainer');
    
    // Función para actualizar la visibilidad de los campos
    function actualizarVisibilidadCampos() {
        console.log('Actualizando visibilidad de campos...');
        
        // Obtener el valor de la nacionalidad del Select2
        const nacionalidad = nacionalidadSelect ? ($('#nacionalidad').val() || '').toLowerCase() : '';
        const tipoDocumento = tipoDocumentoSelect ? ($('#tipoDocumento').val() || '') : '';
        
        console.log('Nacionalidad seleccionada:', nacionalidad);
        console.log('Tipo de documento seleccionado:', tipoDocumento);
        
        // Ocultar todos los campos condicionales inicialmente
        [tipoDocumentoContainer, idOrigenContainer, runContainer].forEach(container => {
            if (container) container.style.display = 'none';
        });
        
        // Si no hay nacionalidad seleccionada, no mostrar nada más
        if (!nacionalidad) {
            console.log('No hay nacionalidad seleccionada, ocultando campos condicionales');
            return;
        }
        
        // Si la nacionalidad es Chile, mostrar solo el RUN
        if (nacionalidad.includes('chile')) {
            console.log('Nacionalidad Chile detectada, mostrando solo RUN');
            if (runContainer) runContainer.style.display = 'block';
            // Hacer que el RUN sea obligatorio
            const runInput = document.getElementById('run');
            if (runInput) runInput.required = true;
            
            // Limpiar y hacer no requeridos los otros campos
            if (tipoDocumentoSelect) {
                $('#tipoDocumento').val(null).trigger('change');
                tipoDocumentoSelect.required = false;
            }
            const idOrigenInput = document.getElementById('idOrigen');
            if (idOrigenInput) idOrigenInput.required = false;
        } 
        // Para otras nacionalidades
        else {
            console.log('Otra nacionalidad detectada, mostrando selector de tipo de documento');
            // Mostrar el selector de tipo de documento
            if (tipoDocumentoContainer) tipoDocumentoContainer.style.display = 'block';
            
            // Si ya se seleccionó un tipo de documento, mostrar el campo correspondiente
            if (tipoDocumento) {
                console.log('Tipo de documento seleccionado:', tipoDocumento);
                if (tipoDocumento === 'run-chileno') {
                    if (runContainer) runContainer.style.display = 'block';
                    const runInput = document.getElementById('run');
                    if (runInput) runInput.required = true;
                    const idOrigenInput = document.getElementById('idOrigen');
                    if (idOrigenInput) idOrigenInput.required = false;
                } else {
                    if (idOrigenContainer) idOrigenContainer.style.display = 'block';
                    const idOrigenInput = document.getElementById('idOrigen');
                    if (idOrigenInput) idOrigenInput.required = true;
                    const runInput = document.getElementById('run');
                    if (runInput) runInput.required = false;
                }
            }
        }
    }
    
    // Configurar eventos
    if (nacionalidadSelect) {
        // Usar el evento de Select2 para detectar cambios
        $('#nacionalidad').on('change', function() {
            console.log('Cambio detectado en nacionalidad');
            actualizarVisibilidadCampos();
        });
    }
    
    if (tipoDocumentoSelect) {
        // Usar el evento de Select2 para detectar cambios
        $('#tipoDocumento').on('change', function() {
            console.log('Cambio detectado en tipo de documento');
            actualizarVisibilidadCampos();
        });
    }
    
    // Inicializar visibilidad
    actualizarVisibilidadCampos();
}

// Variable para el índice actual del carrusel
let currentIndex = 0;

// Objeto para rastrear archivos subidos
const documentosSubidos = {
    identidad: null,
    sucesion: null, // Cambiado para un solo archivo
    apoderado: null,
    firmados: {
        solicitud: null,
        mandato: null
    },
    
    // Verificar si todos los documentos requeridos están completos
    estaCompleto: function() {
        // Verificar documento de identidad
        if (!this.identidad) return false;
        
        // Verificar documentos de sucesión (si aplica)
        const tieneSucesion = document.getElementById('tieneSucesion')?.checked;
        if (tieneSucesion && this.sucesion.length === 0) return false;
        
        // Verificar documentos de apoderado (si aplica)
        const tieneApoderado = document.getElementById('tieneApoderado')?.checked;
        if (tieneApoderado && !this.apoderado) return false;
        
        // Verificar documentos firmados
        if (!this.firmados.solicitud || !this.firmados.mandato) return false;
        
        return true;
    }
};

// Inicialización de la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar el resumen de documentos cuando se muestre la sección
    document.addEventListener('showSection', function(event) {
        if (event.detail.sectionId === 'documentosSubidos') {
            actualizarResumenDocumentos();
        }
    });
    // Variables globales para el formulario
    const fileNameElement = document.querySelector('.file-name');
    
    // Ocultar todas las secciones excepto la primera
    document.querySelectorAll('.form-section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            section.classList.add('active');
        }
    });
    
    // Inicializar el carrusel de progreso
    inicializarCarruselProgreso();
    
    // Inicializar contador de caracteres para observaciones
    const textareaObservaciones = document.getElementById('observacionesDerechos');
    const contadorDerechos = document.getElementById('contadorDerechos');
    
    if (textareaObservaciones && contadorDerechos) {
        // Actualizar contador al cargar la página
        contadorDerechos.textContent = textareaObservaciones.value.length;
        
        // Actualizar contador al escribir
        textareaObservaciones.addEventListener('input', function() {
            contadorDerechos.textContent = this.value.length;
        });
        
        // Añadir clase cuando el textarea tiene foco
        textareaObservaciones.addEventListener('focus', function() {
            this.closest('.textarea-container').classList.add('focused');
        });
        
        textareaObservaciones.addEventListener('blur', function() {
            this.closest('.textarea-container').classList.remove('focused');
        });
    }
    
    // Validar checkboxes de derechos al cambiar
    const checkboxesDerechos = document.querySelectorAll('#derechosAdministrar .form-check-input');
    const mensajeValidacion = document.getElementById('derechosValidationMessage');
    
    // Añadir efecto visual a los checkboxes
    checkboxesDerechos.forEach(checkbox => {
        // Añadir clase al contenedor cuando el checkbox cambia
        checkbox.addEventListener('change', function() {
            const card = this.closest('.derecho-card');
            if (this.checked) {
                card.classList.add('checked');
            } else {
                card.classList.remove('checked');
            }
            validarCheckboxesDerechos();
        });
        
        // Inicializar estado de las tarjetas
        const card = checkbox.closest('.derecho-card');
        if (checkbox.checked) {
            card.classList.add('checked');
        }
    });
    
    // Función para validar los checkboxes
    function validarCheckboxesDerechos() {
        const checkboxes = Array.from(document.querySelectorAll('#derechosAdministrar .form-check-input'));
        const todosMarcados = checkboxes.every(checkbox => checkbox.checked);
        
        // Mostrar/ocultar mensaje de validación
        if (mensajeValidacion) {
            if (todosMarcados) {
                mensajeValidacion.classList.remove('show');
            } else {
                mensajeValidacion.classList.add('show');
            }
        }
        
        // Habilitar/deshabilitar botón de siguiente
        const botonSiguiente = document.querySelector('.btn-siguiente');
        if (botonSiguiente) {
            const currentSection = document.querySelector('.form-section.active');
            if (currentSection && currentSection.id === 'derechosAdministrar') {
                botonSiguiente.disabled = !todosMarcados;
                
                // Añadir clase al botón según el estado
                if (todosMarcados) {
                    botonSiguiente.classList.remove('btn-disabled');
                } else {
                    botonSiguiente.classList.add('btn-disabled');
                }
            }
        }
        
        return todosMarcados;
    }
    
    // Validar al cargar la página
    validarCheckboxesDerechos();
    
    // Inicializar funcionalidad de documentos a firmar
    document.addEventListener('DOMContentLoaded', function() {
        inicializarDocumentosFirmar();
    });
    
    // También inicializar cuando se muestre la sección
    document.addEventListener('showSection', function(e) {
        if (e.detail && e.detail.sectionId === 'documentosFirmar') {
            inicializarDocumentosFirmar();
        }
    });
    
    // Validar antes de enviar el formulario
    const formElement = document.querySelector('form');
    if (formElement) {
        formElement.addEventListener('submit', async function(e) {
            if (formularioEnviado) return;
            formularioEnviado = true;
            const currentSection = document.querySelector('.form-section.active');
            
            // Validar sección de derechos
            if (currentSection && currentSection.id === 'derechosAdministrar') {
                if (!validarCheckboxesDerechos()) {
                    e.preventDefault();
                    mensajeValidacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Validar sección de documentos a firmar
            if (currentSection && currentSection.id === 'documentosFirmar') {
                if (!validarDocumentosFirmar()) {
                    e.preventDefault();
                    document.getElementById('documentosValidationMessage').scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
            
            // === ENVÍO DE FORMULARIO A WEBHOOK (Power Automate) ===
            // Este bloque se ubica justo antes del cierre del eventListener 'submit' del formulario principal
            const webhookUrl = "https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95768cafc46c445081fca1472c94358a/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dpXhd5GjJypNhprFHE1nGChVyPcxqM6xYvpNhwOOkm8"; // <-- Webhook real

            if (currentSection && currentSection.id === 'documentosSubidos') {
                e.preventDefault();
                // === EXTRACCIÓN DE TODOS LOS CAMPOS ===
                // Datos personales
                const nombres = document.getElementById('nombres')?.value.trim() || '';
                const apellidoPaterno = document.getElementById('apellidoPaterno')?.value.trim() || '';
                const apellidoMaterno = document.getElementById('apellidoMaterno')?.value.trim() || '';
                const nacionalidad = document.getElementById('nacionalidad')?.value || '';
                const tipoDocumento = document.getElementById('tipoDocumento')?.value || '';
                const run = document.getElementById('run')?.value.trim() || '';
                const idOrigen = document.getElementById('idOrigen')?.value.trim() || '';
                const fechaNacimiento = document.getElementById('fechaNacimiento')?.value || '';
                const fechaDefuncion = document.getElementById('fechaDefuncion')?.value || '';
                const genero = document.getElementById('genero')?.value || '';
                const seudonimo = document.getElementById('seudonimo')?.value.trim() || '';

                // Contacto
                const paisResidencia = document.getElementById('paisResidencia')?.value || '';
                const region = document.getElementById('region')?.value || '';
                const comuna = document.getElementById('comuna')?.value || '';
                const direccion = document.getElementById('direccion')?.value.trim() || '';
                const detalleDireccion = document.getElementById('detalleDireccion')?.value.trim() || '';
                const email = document.getElementById('email')?.value.trim() || '';
                const codigoPais = document.getElementById('codigoPais')?.value || '';
                const telefono = document.getElementById('telefono')?.value.trim() || '';

                // Apoderado
                const apoderadoNombres = document.getElementById('apoderadoNombres')?.value.trim() || '';
                const apoderadoApellidoPaterno = document.getElementById('apoderadoApellidoPaterno')?.value.trim() || '';
                const apoderadoApellidoMaterno = document.getElementById('apoderadoApellidoMaterno')?.value.trim() || '';
                const apoderadoEmail = document.getElementById('apoderadoEmail')?.value.trim() || '';
                const apoderadoCodigoPais = document.getElementById('apoderadoCodigoPais')?.value || '';
                const apoderadoTelefono = document.getElementById('apoderadoTelefono')?.value.trim() || '';

                // Sucesión
                const sucesionNombres = document.getElementById('sucesionNombres')?.value.trim() || '';
                const sucesionApellidoPaterno = document.getElementById('sucesionApellidoPaterno')?.value.trim() || '';
                const sucesionApellidoMaterno = document.getElementById('sucesionApellidoMaterno')?.value.trim() || '';
                const sucesionEmail = document.getElementById('sucesionEmail')?.value.trim() || '';
                const sucesionCodigoPais = document.getElementById('sucesionCodigoPais')?.value || '';
                const sucesionTelefono = document.getElementById('sucesionTelefono')?.value.trim() || '';

                // Ámbito (array de ámbitos activos)
                const ambitos = [];
                const ambitoAudiovisual = document.getElementById('ambitoAudiovisual')?.value;
                const ambitoDramatico = document.getElementById('ambitoDramatico')?.value;
                if (ambitoAudiovisual) ambitos.push(ambitoAudiovisual);
                if (ambitoDramatico) ambitos.push(ambitoDramatico);

                // Clase (array de checkboxes seleccionados)
                const clases = Array.from(document.querySelectorAll('input[name="clase[]"]:checked')).map(cb => cb.value);

                // Sociedad
                const perteneceSociedad = document.querySelector('input[name="perteneceSociedad"]:checked')?.value || '';
                const sociedadPais = document.getElementById('sociedadPais')?.value || '';
                const sociedadNombre = document.getElementById('sociedadNombre')?.value || '';

                // Construir el objeto de datos
                const data = {
                    nombres,
                    apellidoPaterno,
                    apellidoMaterno,
                    nacionalidad,
                    tipoDocumento,
                    run,
                    idOrigen,
                    fechaNacimiento,
                    fechaDefuncion,
                    genero,
                    seudonimo,
                    paisResidencia,
                    region,
                    comuna,
                    direccion,
                    detalleDireccion,
                    email,
                    codigoPais,
                    telefono,
                    apoderadoNombres,
                    apoderadoApellidoPaterno,
                    apoderadoApellidoMaterno,
                    apoderadoEmail,
                    apoderadoCodigoPais,
                    apoderadoTelefono,
                    sucesionNombres,
                    sucesionApellidoPaterno,
                    sucesionApellidoMaterno,
                    sucesionEmail,
                    sucesionCodigoPais,
                    sucesionTelefono,
                    ambito: ambitos.join(', '),
                    clase: clases.join(', '),
                    perteneceSociedad,
                    sociedadPais,
                    sociedadNombre
                };

                try {
                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        mostrarNotificacion('¡Formulario enviado con éxito!', 'success');
                    } else {
                        mostrarNotificacion('Error al enviar el formulario. Intente nuevamente.', 'error');
                    }
                } catch (error) {
                    mostrarNotificacion('Error de conexión. Intente más tarde.', 'error');
                }
            }
        });
    }
    
    // Función para inicializar la funcionalidad de documentos a firmar
    function inicializarDocumentosFirmar() {
        console.log('Inicializando documentos a firmar...');
        
        // Inicializar el panel de instrucciones desplegable
        const instructionHeader = document.querySelector('.instruction-header');
        if (instructionHeader) {
            instructionHeader.addEventListener('click', function() {
                const content = document.getElementById('instruccionesDetalladas');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                this.setAttribute('aria-expanded', !isExpanded);
                content.classList.toggle('show', !isExpanded);
                
                // Guardar el estado en localStorage para recordar la preferencia del usuario
                localStorage.setItem('instruccionesExpandidas', !isExpanded);
            });
            
            // Cargar el estado guardado
            const savedState = localStorage.getItem('instruccionesExpandidas') === 'true';
            if (savedState) {
                instructionHeader.setAttribute('aria-expanded', 'true');
                document.getElementById('instruccionesDetalladas').classList.add('show');
            }
        }
        
        // Configurar descargas de documentos
        const descargarSolicitud = document.getElementById('descargarSolicitud');
        const descargarMandato = document.getElementById('descargarMandato');
        
        // Configurar eventos de descarga
        if (descargarSolicitud) {
            // Remover cualquier event listener existente
            const newSolicitud = descargarSolicitud.cloneNode(true);
            descargarSolicitud.parentNode.replaceChild(newSolicitud, descargarSolicitud);
            
            // Agregar el event listener al nuevo elemento
            newSolicitud.addEventListener('click', function(e) {
                e.preventDefault();
                const url = 'https://atncl.odoo.com/sign/document/mail/13/e3fa90c8-05aa-4a72-a7fc-d8402910cc60';
                window.open(url, '_blank');
            });
        }
        
        if (descargarMandato) {
            // Remover cualquier event listener existente
            const newMandato = descargarMandato.cloneNode(true);
            descargarMandato.parentNode.replaceChild(newMandato, descargarMandato);
            
            // Agregar el event listener al nuevo elemento
            newMandato.addEventListener('click', function(e) {
                e.preventDefault();
                const url = 'https://atncl.odoo.com/sign/document/mail/12/e7bd1633-e98b-4557-b1a0-07ee09f69064';
                window.open(url, '_blank');
            });
        }
        
        // Configurar subida de archivos
        const fileInputs = document.querySelectorAll('.documento-upload-input');
        console.log('Inputs de archivo encontrados:', fileInputs.length);
        
        fileInputs.forEach(input => {
            console.log('Configurando input:', input.id);
            
            // Crear un nuevo input para limpiar cualquier event listener existente
            const newInput = input.cloneNode(true);
            
            // Reemplazar el input existente con el clon
            input.parentNode.replaceChild(newInput, input);
            
            // Agregar el event listener al nuevo input
            newInput.addEventListener('change', function(e) {
                console.log('Archivo seleccionado en', this.id, ':', this.files);
                manejarSubidaArchivo(this);
            });
            
            // Agregar un manejador de clic para forzar la apertura del selector de archivos
            const uploadButton = newInput.nextElementSibling;
            if (uploadButton && uploadButton.classList.contains('documento-upload-button')) {
                uploadButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Detener la propagación para evitar el doble clic
                    newInput.click();
                });
            }
        });
        
        // Configurar botones de eliminar
        function configurarBotonesEliminar() {
            const deleteButtons = document.querySelectorAll('.btn-eliminar-doc');
            console.log('Configurando botones de eliminar. Encontrados:', deleteButtons.length);
            
            deleteButtons.forEach(btn => {
                // Si el botón ya tiene un manejador de eventos, saltar
                if (btn.hasAttribute('data-initialized')) {
                    return;
                }
                
                const targetId = btn.getAttribute('data-target');
                if (!targetId) {
                    console.error('Botón de eliminar sin data-target:', btn);
                    return;
                }
                
                console.log('Configurando botón eliminar para:', targetId);
                
                // Marcar como inicializado
                btn.setAttribute('data-initialized', 'true');
                
                // Agregar el event listener al botón
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Eliminando archivo para input:', targetId);
                    
                    // Limpiar el input de archivo
                    const targetInput = document.getElementById(targetId);
                    if (targetInput) {
                        targetInput.value = '';
                        console.log('Input limpiado:', targetId);
                    }
                    
                    // Encontrar el contenedor padre que tiene tanto el nombre como el botón
                    const infoDiv = btn.closest('.documento-info');
                    if (infoDiv) {
                        const nombreElemento = infoDiv.querySelector('.documento-nombre');
                        if (nombreElemento) {
                            nombreElemento.textContent = 'Ningún archivo seleccionado';
                            console.log('Texto actualizado a "Ningún archivo seleccionado"');
                        }
                        
                        // Ocultar el botón de eliminar
                        btn.style.display = 'none';
                        console.log('Botón de eliminar ocultado');
                    } else {
                        console.error('No se encontró el contenedor de información para:', targetId);
                    }
                    
                    // Actualizar el estado en el objeto de seguimiento
                    if (targetId === 'solicitudFirmada') {
                        documentosSubidos.firmados.solicitud = null;
                    } else if (targetId === 'mandatoFirmado') {
                        documentosSubidos.firmados.mandato = null;
                    }
                    
                    // Actualizar el resumen de documentos
                    actualizarResumenDocumentos();
                    
                    console.log('Estado actualizado en documentosSubidos:', documentosSubidos);
                    
                    // Actualizar la validación
                    validarDocumentosFirmar();
                });
            });
        }
        
        // Configurar los botones de eliminar inicialmente
        configurarBotonesEliminar();
        
        // Función para manejar la subida de archivos
        function manejarSubidaArchivo(input) {
            if (!input.files || !input.files[0]) return;
            
            const file = input.files[0];
            const fileName = file.name;
            const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Tamaño en MB
            const fileType = file.type;
            const inputId = input.id;
            
            console.log('Procesando archivo:', fileName, 'en input:', inputId);
            console.log('Procesando archivo:', fileName, 'Tipo:', fileType, 'Tamaño:', fileSize, 'MB');
            
            // Validar tipo de archivo
            if (fileType !== 'application/pdf') {
                mostrarError(input.id, 'Por favor, suba un archivo en formato PDF.');
                input.value = '';
                return;
            }
            
            // Validar tamaño del archivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarError(input.id, 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
                input.value = '';
                return;
            }
            
            // Limpiar cualquier mensaje de error
            const errorElement = document.getElementById(`error${input.id}`);
            if (errorElement) {
                errorElement.textContent = '';
            }
            
            // Construir el ID del contenedor de información
            const infoDivId = 'info' + input.id.replace('Firmada', '').replace('Firmado', '');
            console.log('Buscando infoDiv con ID:', infoDivId);
            
            // Buscar el elemento por ID de forma insensible a mayúsculas/minúsculas
            let infoDiv = null;
            const allElements = document.querySelectorAll('[id]');
            for (let element of allElements) {
                if (element.id.toLowerCase() === infoDivId.toLowerCase()) {
                    infoDiv = element;
                    break;
                }
            }
            
            if (infoDiv) {
                console.log('InfoDiv encontrada:', infoDiv);
                
                // Actualizar el nombre del archivo
                const fileNameElement = infoDiv.querySelector('.documento-nombre');
                if (fileNameElement) {
                    fileNameElement.textContent = `${fileName} (${fileSize} MB)`;
                    console.log('Texto actualizado en:', fileNameElement);
                } else {
                    console.error('No se encontró el elemento .documento-nombre');
                    return;
                }
                
                // Mostrar el botón de eliminar
                const deleteButton = infoDiv.querySelector('.btn-eliminar-doc');
                if (deleteButton) {
                    deleteButton.style.display = 'inline-flex';
                    deleteButton.style.visibility = 'visible';
                    console.log('Botón de eliminar mostrado');
                }
                
                // Actualizar el objeto de seguimiento
                const fileInfo = {
                    nombre: file.name,
                    tamano: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                    tipo: inputId === 'solicitudFirmada' ? 'Solicitud de Incorporación' : 'Mandato Especial',
                    archivo: file,
                    fechaSubida: new Date().toLocaleString()
                };
                
                if (inputId === 'solicitudFirmada') {
                    documentosSubidos.firmados.solicitud = fileInfo;
                    console.log('Solicitud de incorporación subida:', fileInfo);
                } else if (inputId === 'mandatoFirmado') {
                    documentosSubidos.firmados.mandato = fileInfo;
                    console.log('Mandato especial subido:', fileInfo);
                }
                
                // Actualizar la interfaz de usuario (usando el infoDiv ya encontrado)
                if (infoDiv) {
                    const nombreElemento = infoDiv.querySelector('.documento-nombre');
                    if (nombreElemento) {
                        nombreElemento.textContent = `${file.name} (${fileInfo.tamano})`;
                    }
                    
                    const deleteBtn = infoDiv.querySelector('.btn-eliminar-doc');
                    if (deleteBtn) {
                        deleteBtn.style.display = 'inline-flex';
                    }
                }
                
                // Actualizar el resumen de documentos
                actualizarResumenDocumentos();
                
                // Actualizar la validación
                validarDocumentosFirmar();
                
                console.log('Documento subido actualizado en documentosSubidos:', documentosSubidos);
                
                // Actualizar la validación
                validarDocumentosFirmar();
                
                // Asegurarse de que el botón tenga el manejador de eventos
                configurarBotonesEliminar();
            } else {
                console.error('No se encontró el contenedor de información para el archivo');
            }
        }
    }
    
    // Función para mostrar errores de validación
    function mostrarError(inputId, mensaje) {
        const errorElement = document.getElementById(`error${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        if (errorElement) {
            errorElement.textContent = mensaje;
        }
    }
    
    // Función para validar documentos a firmar
    function validarDocumentosFirmar() {
        const solicitud = document.getElementById('solicitudFirmada');
        const mandato = document.getElementById('mandatoFirmado');
        const mensajeValidacion = document.getElementById('documentosValidationMessage');
        let valido = true;
        
        if (mensajeValidacion) {
            mensajeValidacion.style.display = 'none';
        }
        
        // Validar solicitud
        if (!solicitud || !solicitud.files || solicitud.files.length === 0) {
            mostrarError('solicitudFirmada', 'Por favor, suba la solicitud firmada');
            valido = false;
        }
        
        // Validar mandato
        if (!mandato || !mandato.files || mandato.files.length === 0) {
            mostrarError('mandatoFirmado', 'Por favor, suba el mandato firmado');
            valido = false;
        }
        
        if (!valido && mensajeValidacion) {
            mensajeValidacion.style.display = 'flex';
        }
        
        return valido;
    }
    
    // Inicializar Select2 para los campos de selección
    $('.select2').select2({
        placeholder: 'Seleccione una opción',
        allowClear: true,
        width: '100%',
        dropdownParent: $('body')
    });
    
    // Cargar datos iniciales
    await cargarNacionalidades();
    
    // Configurar manejador de eventos para el campo de región
    const selectRegion = document.getElementById('region');
    if (selectRegion) {
        // Inicializar Select2 específicamente para región
        $(selectRegion).select2({
            placeholder: 'Seleccione una región',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        
        // Agregar manejador de cambio
        $(selectRegion).on('change', function() {
            actualizarComunas($(this).val());
        });
    }
    
    // Inicializar Select2 para comuna
    const selectComuna = document.getElementById('comuna');
    if (selectComuna) {
        $(selectComuna).select2({
            placeholder: 'Seleccione una comuna',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            disabled: true
        });
    }
    
    // La visibilidad condicional se configura después de cargar las nacionalidades

    // Variables globales
    const form = document.getElementById('socioForm');
    const currentSection = document.querySelector('.form-section.active');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnAtras = document.getElementById('btnAtras');
    const btnCancelar = document.getElementById('btnCancelar');
    const fileUpload = document.getElementById('fotocopiaDocumento');
    // fileNameElement ya está declarado al inicio de la función
    
    // Referencias a los nuevos campos de contacto
    const paisResidencia = document.getElementById('paisResidencia');
    const region = document.getElementById('region');
    const comuna = document.getElementById('comuna');
    const direccion = document.getElementById('direccion');
    const email = document.getElementById('email');
    const telefono = document.getElementById('telefono');
    
    // Manejar cambio en el país de residencia
    if (paisResidencia) {
        console.log('Configurando manejador de cambio para país de residencia');
        // Convertir a jQuery para manejar mejor los eventos de Select2
        $(paisResidencia).on('change', async function() {
            console.log('País de residencia cambiado a:', this.value);
            const regionSelect = document.getElementById('region');
            const comunaSelect = document.getElementById('comuna');
            
            // Verificar si el valor es Chile (comparación flexible)
            const paisSeleccionado = this.value ? this.value.toString().trim().toLowerCase() : '';
            if (paisSeleccionado === 'chile' || paisSeleccionado.includes('chile')) {
                console.log('Chile detectado como país de residencia');
                // Habilitar región si se selecciona Chile
                regionSelect.disabled = false;
                $(regionSelect).prop('disabled', false);
                
                // Limpiar selección de comuna
                comunaSelect.disabled = true;
                $(comunaSelect).prop('disabled', true).val(null).trigger('change');
                
                // Cargar regiones
                try {
                    await cargarRegionesYComunas();
                    // Forzar la actualización de Select2
                    $(regionSelect).trigger('change.select2');
                } catch (error) {
                    console.error('Error al cargar regiones:', error);
                }
            } else {
                // Deshabilitar y limpiar región y comuna si no es Chile
                regionSelect.disabled = true;
                $(regionSelect).prop('disabled', true).val(null).trigger('change');
                
                comunaSelect.disabled = true;
                $(comunaSelect).prop('disabled', true).val(null).trigger('change');
                
                // Limpiar opciones de región y comuna
                $(regionSelect).empty().append(new Option('Seleccione una región', ''));
                $(comunaSelect).empty().append(new Option('Seleccione una comuna', ''));
                
                // Forzar actualización de Select2
                $(regionSelect).trigger('change.select2');
                $(comunaSelect).trigger('change.select2');
            }
        });
    }
    
    // Validación del campo RUN (formato chileno)
    function validarRUN(run) {
        // Eliminar puntos y espacios, convertir a mayúsculas
        const runLimpio = run.replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
        
        // Validar formato básico (7-8 dígitos + guión + dígito verificador K o número)
        if (!/^\d{7,8}-[\dKk]$/.test(runLimpio)) {
            return false;
        }
        
        // Separar número y dígito verificador
        const [numero, digitoVerificador] = runLimpio.split('-');
        
        // Validar dígito verificador
        let suma = 0;
        let multiplicador = 2;
        
        // Recorrer el número de derecha a izquierda
        for (let i = numero.length - 1; i >= 0; i--) {
            suma += parseInt(numero.charAt(i)) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const resto = suma % 11;
        let dvEsperado = 11 - resto;
        
        // Ajustar dígito verificador esperado
        if (dvEsperado === 11) dvEsperado = '0';
        if (dvEsperado === 10) dvEsperado = 'K';
        
        // Comparar con el dígito verificador ingresado
        return digitoVerificador.toUpperCase() === dvEsperado.toString();
    }
    
    // Formatear RUN mientras se escribe
    function formatearRUN(input) {
        // Obtener el valor actual, eliminar todo excepto números y K
        let run = input.value.replace(/[^\dKk]/gi, '').toUpperCase();
        
        // Si hay algo para formatear
        if (run.length > 0) {
            // Eliminar ceros al inicio
            run = run.replace(/^0+/, '');
            
            // Si solo queda la K, añadir un 0 delante
            if (run === 'K') {
                run = '0' + run;
            }
            
            // Si el RUN es demasiado largo, truncarlo
            if (run.length > 9) {
                run = run.substring(0, 9);
            }
            
            // Si el último carácter no es K, forzar mayúscula
            if (run.length > 0 && run[run.length - 1].toLowerCase() === 'k') {
                run = run.substring(0, run.length - 1) + 'K';
            }
            
            // Si es un RUN válido (más de 1 dígito y termina en número o K)
            if (run.length > 1 && /\d$/.test(run)) {
                // Separar el DV
                const dv = run.slice(-1);
                let cuerpo = run.slice(0, -1);
                
                // Formatear con puntos
                cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                
                // Unir con guión
                run = `${cuerpo}-${dv}`;
            } else if (run.length > 1 && /[Kk]$/.test(run)) {
                // Si termina en K, asegurarse de que tenga al menos un dígito antes
                const cuerpo = run.slice(0, -1);
                if (cuerpo.length > 0) {
                    // Formatear con puntos
                    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    run = `${cuerpoFormateado}-K`;
                } else {
                    // Si solo hay una K, dejarla como está
                    run = '0-K';
                }
            }
        }
        
        // Actualizar el valor del input
        input.value = run;
        return run;
    }
    
    // Función para validar un campo individual
    function validarCampo(campo) {
        const valor = campo.value.trim();
        const esRequerido = campo.hasAttribute('required');
        const tipo = campo.type;
        const nombre = campo.name;
        const errorElement = campo.closest('.form-group')?.querySelector('.error-message');
        
        // Limpiar mensaje de error previo si existe el elemento
        if (errorElement) {
        errorElement.textContent = '';
        }
        campo.classList.remove('is-invalid');
        
        // Validar campo requerido
        if (esRequerido && !valor) {
            campo.classList.add('is-invalid');
            if (errorElement) {
            errorElement.textContent = 'Este campo es obligatorio';
            }
            return false;
        }
        
        // Validaciones específicas por tipo de campo
        if (valor) {
            switch (tipo) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(valor)) {
                        campo.classList.add('is-invalid');
                        if (errorElement) {
                        errorElement.textContent = 'Ingrese un correo electrónico válido';
                        }
                        return false;
                    }
                    break;
                    
                case 'tel':
                    const telefonoRegex = /^[0-9+\-\s()]{8,20}$/;
                    if (!telefonoRegex.test(valor)) {
                        campo.classList.add('is-invalid');
                        if (errorElement) {
                        errorElement.textContent = 'Ingrese un número de teléfono válido';
                        }
                        return false;
                    }
                    break;
                    
                case 'number':
                    if (campo.min && parseFloat(valor) < parseFloat(campo.min)) {
                        campo.classList.add('is-invalid');
                        if (errorElement) {
                        errorElement.textContent = `El valor mínimo permitido es ${campo.min}`;
                        }
                        return false;
                    }
                    if (campo.max && parseFloat(valor) > parseFloat(campo.max)) {
                        campo.classList.add('is-invalid');
                        if (errorElement) {
                        errorElement.textContent = `El valor máximo permitido es ${campo.max}`;
                        }
                        return false;
                    }
                    break;
                    
                case 'file':
                    if (campo.files.length > 0) {
                        const archivo = campo.files[0];
                        const extensionesPermitidas = /(\.|\/)(pdf|jpg|jpeg|png)$/i;
                        
                        if (!extensionesPermitidas.test(archivo.name)) {
                            campo.classList.add('is-invalid');
                            if (errorElement) {
                            errorElement.textContent = 'Solo se permiten archivos PDF o imágenes (JPG, JPEG, PNG)';
                            }
                            return false;
                        }
                        
                        // Tamaño máximo de 5MB
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (archivo.size > maxSize) {
                            campo.classList.add('is-invalid');
                            if (errorElement) {
                            errorElement.textContent = 'El archivo no debe superar los 5MB';
                            }
                            return false;
                        }
                    }
                    break;
            }
            
            // Validación personalizada para el campo RUN
            if (nombre === 'run' && !validarRUN(valor)) {
                campo.classList.add('is-invalid');
                if (errorElement) {
                errorElement.textContent = 'Ingrese un RUN válido (ej: 12.345.678-9)';
                }
                return false;
            }
        }
        
        return true;
    }
    
    // Validar todos los campos de una sección
    function validarSeccion(seccion) {
        let valido = true;
        const campos = seccion.querySelectorAll('input, select, textarea');
        
        campos.forEach(campo => {
            if (!validarCampo(campo)) {
                valido = false;
            }
        });
        
        return valido;
    }
    
    // Mostrar la sección actual
    function mostrarSeccion(idSeccion) {
        // Ocultar todas las secciones
        document.querySelectorAll('.form-section').forEach(seccion => {
            seccion.style.display = 'none';
            seccion.classList.remove('active');
        });
        
        // Mostrar la sección solicitada
        const seccion = document.getElementById(idSeccion);
        if (seccion) {
            seccion.style.display = 'block';
            seccion.classList.add('active');
            
            // Actualizar el índice actual para el carrusel
            const sectionNumber = parseInt(seccion.getAttribute('data-section') || '1');
            actualizarBarraProgreso(sectionNumber);
            
            // Inicializar documentos a firmar si es la sección activa
            if (idSeccion === 'documentosFirmar') {
                inicializarDocumentosFirmar();
            }
            
            setTimeout(() => {
            seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);

            // Inicializar los grupos dinámicos solo una vez cuando se muestre la sección
            if (idSeccion === 'datosGenerales' && !datosGeneralesInicializados) {
                inicializarGruposDinamicos();
                datosGeneralesInicializados = true;
                console.log('Grupos dinámicos de Datos Generales inicializados.');
            }
        }
        // Mostrar/ocultar el botón de enviar según la sección
        const btnEnviar = document.getElementById('btnEnviar');
        if (btnEnviar) {
            if (idSeccion === 'documentosSubidos') {
                btnEnviar.style.display = 'inline-block'; // o 'block' según tu preferencia visual
            } else {
                btnEnviar.style.display = 'none';
            }
        }
    }
    
    // Inicializar el carrusel de progreso
    function inicializarCarruselProgreso() {
        const track = document.querySelector('.progress-track');
        const slides = document.querySelectorAll('.progress-slide');
        const prevBtn = document.querySelector('.nav-arrow.prev');
        const nextBtn = document.querySelector('.nav-arrow.next');
        const slidesToShow = 4; // Número de pasos visibles a la vez
        
        if (!track || !slides.length) return;
        
        // Calcular el ancho de cada slide basado en el número de slides a mostrar
        const slideWidth = 100 / slidesToShow;
        slides.forEach(slide => {
            slide.style.minWidth = `calc(${slideWidth}% - 10px)`;
        });
        
        // Función para actualizar la visibilidad de los botones de navegación
        function updateNavButtons() {
            if (!prevBtn || !nextBtn) return;
            const maxIndex = Math.max(0, slides.length - slidesToShow);
            prevBtn.disabled = window.currentIndex <= 0;
            nextBtn.disabled = window.currentIndex >= maxIndex;
        }
        
        // Función para mover el carrusel
        function moveToSlide(index) {
            if (!track) return;
            
            // Asegurarse de que el índice esté dentro de los límites
            const maxIndex = Math.max(0, slides.length - slidesToShow);
            const newIndex = Math.max(0, Math.min(index, maxIndex));
            
            // Solo actualizar si el índice ha cambiado
            if (window.currentIndex !== newIndex) {
                window.currentIndex = newIndex;
                const offset = -window.currentIndex * (100 / slidesToShow);
                track.style.transition = 'transform 0.3s ease';
                track.style.transform = `translateX(${offset}%)`;
                updateNavButtons();
                
                // Forzar actualización del DOM
                track.offsetHeight;
            }
        }
        
        // Event listeners para los botones de navegación
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                moveToSlide(window.currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                moveToSlide(window.currentIndex + 1);
            });
        }
        
        // Inicializar botones de navegación
        window.currentIndex = 0;
        updateNavButtons();
        
        // Hacer que los slides sean clickeables para navegar
        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                // Mapear el índice a los IDs de sección correctos
                const sectionIds = [
                    'datosAutor',
                    'datosContacto',
                    'datosApoderado',
                    'datosSucesion',
                    'datosTecnicos',
                    'datosGenerales',
                    'obras',
                    'derechosAdministrar',
                    'documentosFirmar',
                    'documentosSubidos'
                ];
                
                if (sectionIds[index]) {
                    mostrarSeccion(sectionIds[index]);
                    // Actualizar la barra de progreso
                    actualizarBarraProgreso(index + 1);
                }
            });
        });
    }
    
    // Actualizar la barra de progreso
    function actualizarBarraProgreso(pasoActual) {
        const slides = document.querySelectorAll('.progress-slide');
        if (!slides.length) return;
        
        const slidesToShow = 4;
        const totalSlides = slides.length;
        const maxIndex = Math.max(0, totalSlides - slidesToShow);
        const track = document.querySelector('.progress-track');
        if (!track) return;
        
        // Actualizar clases activas
        slides.forEach((slide, index) => {
            const step = slide.querySelector('.progress-step');
            const label = slide.querySelector('.step-label');
            const isActive = (index + 1) === pasoActual;
            
            slide.classList.toggle('active', isActive);
            if (step) step.classList.toggle('active', isActive);
            if (label) label.classList.toggle('active', isActive);
            
            // Si es el paso actual, asegurarse de que sea visible
            if (isActive) {
                let targetIndex = 0;
                const currentIndex = index;
                
                // Calcular el índice objetivo según la posición del paso actual
                if (currentIndex <= 1) {
                    targetIndex = 0; // Primeros dos pasos
                } else if (currentIndex >= totalSlides - 2) {
                    targetIndex = Math.max(0, totalSlides - slidesToShow); // Últimos dos pasos
                } else {
                    targetIndex = currentIndex - 1; // Pasos intermedios
                }
                
                // Asegurar que no nos pasemos del máximo índice
                targetIndex = Math.min(targetIndex, maxIndex);
                
                // Solo actualizar si es necesario
                const isOutOfView = currentIndex < window.currentIndex || 
                                   currentIndex >= window.currentIndex + slidesToShow;
                
                if (isOutOfView || window.currentIndex > maxIndex) {
                    window.currentIndex = targetIndex;
                    const offset = -window.currentIndex * (100 / slidesToShow);
                    track.style.transition = 'transform 0.3s ease';
                    track.style.transform = `translateX(${offset}%)`;
                    track.offsetHeight; // Forzar actualización del DOM
                }
            }
        });
        
        // Actualizar estado de los botones de navegación
        const prevBtn = document.querySelector('.nav-arrow.prev');
        const nextBtn = document.querySelector('.nav-arrow.next');
        
        if (prevBtn) prevBtn.disabled = window.currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = window.currentIndex >= maxIndex;
    }
    
    // Manejador de eventos para el campo de carga de archivos de identidad
    document.addEventListener('DOMContentLoaded', function() {
        const fotocopiaDocumento = document.getElementById('fotocopiaDocumento');
        const fotocopiaDocumentoFileName = document.querySelector('#fotocopiaDocumento + .file-name');
        
        if (fotocopiaDocumento) {
            // Actualizar el estado inicial
            if (fotocopiaDocumento.files.length > 0) {
                const file = fotocopiaDocumento.files[0];
                const fileName = file.name;
                const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                
                documentosSubidos.identidad = {
                    nombre: fileName,
                    tamano: fileSize + ' MB',
                    tipo: 'Identificación',
                    archivo: file
                };
                
                if (fotocopiaDocumentoFileName) {
                    fotocopiaDocumentoFileName.textContent = `${fileName} (${fileSize} MB)`;
                }
            }
            
            // Configurar el manejador de cambios
            fotocopiaDocumento.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name;
                    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                    
                    // Actualizar el nombre del archivo
                    if (fotocopiaDocumentoFileName) {
                        fotocopiaDocumentoFileName.textContent = `${fileName} (${fileSize} MB)`;
                        fotocopiaDocumentoFileName.style.display = 'block';
            }
                    
                    // Actualizar el objeto de seguimiento
                    documentosSubidos.identidad = {
                        nombre: fileName,
                        tamano: fileSize + ' MB',
                        tipo: 'Identificación',
                        archivo: file
                    };
                    
                    console.log('Documento de identidad subido:', documentosSubidos.identidad);
                } else {
                    if (fotocopiaDocumentoFileName) {
                        fotocopiaDocumentoFileName.textContent = 'Ningún archivo seleccionado';
                        fotocopiaDocumentoFileName.style.display = 'none';
                    }
                    documentosSubidos.identidad = null;
                }
                
                // Actualizar el resumen de documentos
                actualizarResumenDocumentos();
                validarCampo(this);
        });
    }
    });
    
    // Función para actualizar el resumen de documentos
    function actualizarResumenDocumentos() {
        const crearHtmlDocumento = (doc, nombrePorDefecto = 'Documento') => {
            if (!doc || !doc.archivo) { // Verificamos que exista el objeto archivo
                return `
                <div class="sin-documento">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>No se ha cargado ${nombrePorDefecto.toLowerCase()}</span>
                </div>
            `;
            }
            
            const urlArchivo = URL.createObjectURL(doc.archivo);

            return `
                <div class="documento-item">
                    <div class="documento-info">
                        <i class="fas fa-check-circle"></i>
                        <div class="documento-detalle">
                            <div class="documento-nombre">${doc.nombre}</div>
                            <div class="documento-tamano">${doc.tamano}</div>
                        </div>
                    </div>
                    <div class="documento-acciones">
                        <a href="${urlArchivo}" target="_blank" class="btn btn-documento btn-ver" title="Ver documento">
                            <i class="fas fa-eye"></i> Ver
                        </a>
                    </div>
                </div>
            `;
        };

        // Documento de Identidad
        const identidadContainer = document.getElementById('resumenDocumentoIdentidad');
        if (identidadContainer) {
            identidadContainer.innerHTML = crearHtmlDocumento(documentosSubidos.identidad, 'ningún documento de identidad');
        }
        
        // Documento de Apoderado
        const apoderadoContainer = document.getElementById('resumenDocumentosApoderado');
        if (apoderadoContainer) {
            apoderadoContainer.innerHTML = crearHtmlDocumento(documentosSubidos.apoderado, 'ningún documento de apoderado');
        }

        // Documento de Sucesión
        const sucesionContainer = document.getElementById('resumenDocumentosSucesion');
        if (sucesionContainer) {
            sucesionContainer.innerHTML = crearHtmlDocumento(documentosSubidos.sucesion, 'ningún documento de sucesión');
        }

        // Documentos Firmados
        const firmadosContainer = document.getElementById('resumenDocumentosFirmados');
        if (firmadosContainer) {
            const docsFirmados = [
                { nombre: 'Solicitud de Incorporación', doc: documentosSubidos.firmados.solicitud },
                { nombre: 'Mandato Especial', doc: documentosSubidos.firmados.mandato }
            ].filter(d => d.doc && d.doc.archivo);

            if (docsFirmados.length > 0) {
                firmadosContainer.innerHTML = docsFirmados.map(({ nombre, doc }) => {
                    const urlArchivoFirmado = URL.createObjectURL(doc.archivo);
                    return `
                    <div class="documento-item">
                        <div class="documento-info">
                            <i class="fas fa-check-circle"></i>
                            <div class="documento-detalle">
                                <div class="documento-nombre">${nombre}</div>
                                <div class="documento-subinfo">
                                    <span class="documento-nombre">${doc.nombre}</span>
                                    <span class="documento-tamano">${doc.tamano}</span>
                                </div>
                            </div>
                        </div>
                        <div class="documento-acciones">
                            <a href="${urlArchivoFirmado}" target="_blank" class="btn btn-documento btn-ver" title="Ver documento firmado">
                                <i class="fas fa-eye"></i> Ver
                            </a>
                        </div>
                    </div>
                `}).join('');
            } else {
                firmadosContainer.innerHTML = `
                    <div class="sin-documento">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Faltan documentos firmados por cargar</span>
                    </div>
                `;
            }
        }

        // Actualizar estado de validación general
        const validacionContainer = document.getElementById('resumenValidacion');
        if (validacionContainer) {
            // ... (la lógica de validación general se puede mejorar aquí si es necesario) ...
        }
    }
    
    // Actualizar el resumen de documentos cuando se muestre la sección
    const documentosSubidosSection = document.getElementById('documentosSubidos');
    if (documentosSubidosSection) {
        const observer = new MutationObserver(function(mutations) {
            if (documentosSubidosSection.classList.contains('active')) {
                actualizarResumenDocumentos();
            }
        });
        
        observer.observe(documentosSubidosSection, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Manejador de eventos para el botón Siguiente
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', function(e) {
            e.preventDefault();
            const seccionActual = document.querySelector('.form-section.active');
            const secciones = document.querySelectorAll('.form-section');
            const indiceActual = Array.from(secciones).indexOf(seccionActual);
            
            // Avanzar a la siguiente sección sin validar
            if (indiceActual < secciones.length - 1) {
                const siguienteSeccion = secciones[indiceActual + 1];
                mostrarSeccion(siguienteSeccion.id);
                
                // Actualizar la barra de progreso
                actualizarBarraProgreso(indiceActual + 2); // +2 porque el índice comienza en 0
                
                // Habilitar el botón Atrás si no estamos en la primera sección
                if (btnAtras) {
                    btnAtras.disabled = false;
                }
                
                // Desplazar al inicio de la nueva sección
                siguienteSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Manejador de eventos para el botón Atrás
    if (btnAtras) {
        btnAtras.addEventListener('click', function(e) {
            e.preventDefault();
            const seccionActual = document.querySelector('.form-section.active');
            const secciones = document.querySelectorAll('.form-section');
            const indiceActual = Array.from(secciones).indexOf(seccionActual);
            
            // Retroceder a la sección anterior
            if (indiceActual > 0) {
                const seccionAnterior = secciones[indiceActual - 1];
                mostrarSeccion(seccionAnterior.id);
                
                // Actualizar la barra de progreso
                actualizarBarraProgreso(indiceActual); // El índice es base 1 para la barra de progreso
                
                // Deshabilitar el botón Atrás si volvemos a la primera sección
                if (indiceActual === 1) {
                    btnAtras.disabled = true;
                }
                
                // Desplazar al inicio de la sección anterior
                seccionAnterior.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Manejador de eventos para el botón Cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cancelar el registro? Se perderán todos los datos ingresados.')) {
                // Aquí iría la lógica para cancelar el registro
                console.log('Registro cancelado');
                // window.location.href = 'index.html'; // Redirigir a la página principal
            }
        });
    }
    
    // Validación en tiempo real para los campos de texto
    document.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
        
        // Para los campos de texto, validar también mientras se escribe
        if (campo.type === 'text' || campo.type === 'email' || campo.type === 'tel' || campo.type === 'number') {
            campo.addEventListener('input', function() {
                validarCampo(this);
            });
        }
    });
    
    // Inicializar la barra de progreso
    actualizarBarraProgreso(1);
    
    // Inicializar el selector de códigos de país
    inicializarSelectorCodigoPais();
    
    // Inicializar la lógica de la sección de Datos Técnicos
    inicializarDatosTecnicos();
    
    // Inicializar la funcionalidad de obras dinámicas
    inicializarObrasDinamicas();
    
    inicializarManejadorDeArchivos();
    actualizarResumenDocumentos(); // Para inicializar el resumen al cargar la página
    inicializarObrasDinamicas();
    // inicializarGruposDinamicos(); // Esta línea debe ser eliminada
});

function inicializarManejadorDeArchivos() {
    const fileInputs = [
        { id: 'fotocopiaDocumento', tipo: 'identidad' },
        { id: 'apoderadoDocumento', tipo: 'apoderado' },
        { id: 'sucesionDocumento', tipo: 'sucesion' }
    ];

    fileInputs.forEach(({ id, tipo }) => {
        const input = document.getElementById(id);
        if (!input) return;

        const formGroup = input.closest('.form-group.file-upload');
        if (!formGroup) return;
        
        const fileInfo = formGroup.querySelector('.file-info');
        const fileNameSpan = formGroup.querySelector('.file-name');
        const defaultIcon = fileInfo.querySelector('i.fa-upload');
        const errorElement = formGroup.querySelector('.error-message');
        const defaultText = fileNameSpan ? fileNameSpan.textContent : 'Seleccionar archivo';

        const resetUI = () => {
            if (fileNameSpan) fileNameSpan.textContent = defaultText;
            if (errorElement) errorElement.textContent = '';
            
            const existingPreview = fileInfo.querySelector('.file-preview, .file-icon, .btn-remove-file-preview');
            if (existingPreview) existingPreview.parentElement.removeChild(existingPreview);
            
            if (defaultIcon && !fileInfo.contains(defaultIcon)) {
                fileInfo.prepend(defaultIcon);
            }
        };

        input.addEventListener('change', function(event) {
            resetUI();
            const file = event.target.files[0];

            if (!file) {
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }
            
            // --- Validación ---
            const validImageTypes = ['image/jpeg', 'image/png'];
            const validFileTypes = ['application/pdf'];
            const allValidTypes = [...validImageTypes, ...validFileTypes];

            if (!allValidTypes.includes(file.type)) {
                errorElement.textContent = 'Solo se admiten archivos PDF, JPG o PNG.';
                input.value = '';
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5 MB
                errorElement.textContent = 'El archivo no debe superar los 5MB.';
                input.value = '';
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }

            // --- Actualizar UI y Objeto de Datos ---
            errorElement.textContent = '';
            const fileInfoForObject = {
                nombre: file.name,
                tamano: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                tipo: `Documento de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
                archivo: file,
                fechaSubida: new Date().toLocaleString()
            };

            documentosSubidos[tipo] = fileInfoForObject;

            if (fileNameSpan) fileNameSpan.textContent = `${file.name} (${fileInfoForObject.tamano})`;
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-remove-file-preview';
            removeBtn.title = 'Eliminar archivo';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.position = 'relative';
            removeBtn.style.zIndex = '2';

            if (defaultIcon) defaultIcon.remove();

            if (validImageTypes.includes(file.type)) {
                const previewImg = document.createElement('img');
                previewImg.className = 'file-preview';
                previewImg.src = URL.createObjectURL(file);
                fileInfo.prepend(previewImg);
            } else {
                const pdfIcon = document.createElement('i');
                pdfIcon.className = 'fas fa-file-pdf file-icon';
                fileInfo.prepend(pdfIcon);
            }
            
            fileInfo.appendChild(removeBtn);

            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                input.value = '';
                documentosSubidos[tipo] = null;
                resetUI();
                actualizarResumenDocumentos();
            });

            actualizarResumenDocumentos();
        });
    });
}

// Función para inicializar la lógica de la sección de Datos Técnicos
function inicializarDatosTecnicos() {
    // Referencias a los elementos del formulario
    const btnAmbitos = document.querySelectorAll('.btn-ambito');
    const claseOptions = document.querySelectorAll('.clase-option');
    const sociedadRadios = document.querySelectorAll('.sociedad-radio');
    const sociedadFields = document.getElementById('sociedadFields');
    const sociedadPais = document.getElementById('sociedadPais');
    const sociedadNombre = document.getElementById('sociedadNombre');
    
    // Verificar que los elementos existan
    if (!sociedadFields) {
        console.error('Elemento sociedadFields no encontrado');
        return;
    }
    if (!sociedadPais) {
        console.error('Elemento sociedadPais no encontrado');
        return;
    }
    if (!sociedadNombre) {
        console.error('Elemento sociedadNombre no encontrado');
        return;
    }
    
    console.log('Elementos de sociedad encontrados:', {
        sociedadFields: !!sociedadFields,
        sociedadPais: !!sociedadPais,
        sociedadNombre: !!sociedadNombre
    });
    
    // Manejador de eventos para los botones de ámbito
    function manejarSeleccionAmbito(event) {
        const btn = event.currentTarget;
        const ambito = btn.dataset.ambito;
        const inputHidden = document.getElementById(`ambito${ambito.charAt(0).toUpperCase() + ambito.slice(1)}`);
        
        // Alternar la clase active en el botón
        btn.classList.toggle('active');
        
        // Actualizar el valor del input hidden
        if (btn.classList.contains('active')) {
            inputHidden.value = ambito === 'Audiovisual' ? 'Audiovisual' : 'Dramático';
        } else {
            inputHidden.value = '';
        }
        
        // Actualizar las clases disponibles
        actualizarClasesDisponibles();
    }
    
    // Actualizar las clases disponibles según los ámbitos seleccionados
    function actualizarClasesDisponibles() {
        const ambitosSeleccionados = Array.from(btnAmbitos).filter(btn => btn.classList.contains('active'));
        
        // Si no hay ningún ámbito seleccionado, deshabilitar todas las opciones
        if (ambitosSeleccionados.length === 0) {
            claseOptions.forEach(option => {
                option.classList.remove('activo');
                const input = option.querySelector('input');
                if (input) input.disabled = true;
            });
            document.getElementById('claseError').textContent = 'Seleccione al menos un ámbito';
            return;
        }
        
        // Limpiar mensaje de error
        document.getElementById('claseError').textContent = '';
        
        // Obtener los ámbitos seleccionados
        const ambitosActivos = ambitosSeleccionados.map(btn => btn.dataset.ambito);
        
        // Actualizar las opciones de clase según los ámbitos seleccionados
        claseOptions.forEach(option => {
            const ambitoClase = option.dataset.ambito;
            const input = option.querySelector('input');
            
            if (ambitosActivos.includes(ambitoClase)) {
                option.classList.add('activo');
                if (input) input.disabled = false;
            } else {
                option.classList.remove('activo');
                if (input) {
                    input.checked = false;
                    input.disabled = true;
                }
            }
        });
    }
    
    // Manejador de eventos para la selección de sociedad
    function toggleSociedadFields(event) {
        const mostrarCampos = event.target.value === 'si';
        const camposSociedad = document.querySelector('.sociedad-fields');
        
        if (mostrarCampos) {
            // Habilitar los campos
            sociedadPais.disabled = false;
            sociedadNombre.disabled = false;
            
            // Mostrar los campos de sociedad
            camposSociedad.classList.add('activo');
            
            // Inicializar Select2 para los campos de sociedad
            $(sociedadPais).select2({
                placeholder: 'Seleccione un país',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            $(sociedadNombre).select2({
                placeholder: 'Seleccione una sociedad',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Inicializar Select2 para el país
            $(sociedadPais).select2({
                placeholder: 'Seleccione un país',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Inicializar Select2 para la sociedad
            $(sociedadNombre).select2({
                placeholder: 'Seleccione una sociedad',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Agregar un solo event listener para el cambio de país
            $(sociedadPais).off('change.sociedad').on('change.sociedad', cargarSociedadesPorPais);
            
            console.log('Event listeners configurados para cambio de país');
            
            // Cargar países en el selector de países
            cargarPaisesSociedades();
            
            console.log('Campos de sociedad habilitados y Select2 inicializado');
        } else {
            // Ocultar los campos de sociedad
            camposSociedad.classList.remove('activo');
            
            // Deshabilitar los campos
            sociedadPais.disabled = true;
            sociedadNombre.disabled = true;
            
            // Limpiar los valores
            $(sociedadPais).val(null).trigger('change');
            $(sociedadNombre).empty().append(new Option('Seleccione una sociedad', '')).trigger('change');
            
            // Actualizar Select2
            if ($(sociedadPais).hasClass('select2-hidden-accessible')) {
                $(sociedadPais).select2('enable', false);
            }
            
            if ($(sociedadNombre).hasClass('select2-hidden-accessible')) {
                $(sociedadNombre).select2('enable', false);
            }
            
            // Remover event listeners
            $(sociedadPais).off('change');
            $(sociedadPais).off('select2:select');
            
            console.log('Campos de sociedad deshabilitados');
        }
    }
    
    // Función para cargar países en el selector de sociedades
    async function cargarPaisesSociedades() {
        console.log('Función cargarPaisesSociedades ejecutada');
        try {
            console.log('Iniciando fetch de sociedades.json');
            const response = await fetch('assets/sociedades.json');
            console.log('Respuesta del fetch:', response.status, response.ok);
            if (!response.ok) throw new Error('No se pudo cargar el archivo de sociedades');
            const sociedades = await response.json();
            console.log('Sociedades cargadas del JSON:', sociedades.length);
            
            // Obtener países únicos
            const paises = [...new Set(sociedades.map(s => s.País))].sort();
            console.log('Países únicos encontrados:', paises);
            
            // Limpiar opciones existentes usando Select2
            $(sociedadPais).empty().append(new Option('Seleccione un país', ''));
            
            // Agregar opciones de países usando Select2
            paises.forEach(pais => {
                const option = new Option(pais, pais);
                $(sociedadPais).append(option);
            });
            
            // Inicializar Select2 después de cargar las opciones
            $(sociedadPais).trigger('change');
            
            console.log(`Cargados ${paises.length} países en el selector de sociedades`);
            
        } catch (error) {
            console.error('Error al cargar las sociedades:', error);
        }
    }
    
    // Manejador de eventos para cuando cambia el país
    function cargarSociedadesPorPais() {
        // Usar el valor directamente del select2 para asegurar consistencia
        const paisSeleccionado = $(sociedadPais).val();
        
        console.log('=== CAMBIO DE PAÍS ===');
        console.log('País seleccionado:', paisSeleccionado);
        
        // Limpiar y deshabilitar temporalmente el select de sociedades
        $(sociedadNombre).empty().append(new Option('Cargando sociedades...', '', true, true));
        $(sociedadNombre).prop('disabled', true).trigger('change');
        
        if (!paisSeleccionado) {
            console.log('No hay país seleccionado, limpiando sociedades');
            // Actualizar Select2 con opción por defecto
            $(sociedadNombre).empty()
                .append(new Option('Seleccione una sociedad', '', true, true))
                .prop('disabled', true)
                .trigger('change');
            return;
        }
        
        console.log('Cargando sociedades para país:', paisSeleccionado);
        
        // Cargar sociedades del país seleccionado
        fetch('assets/sociedades.json')
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar las sociedades');
                return response.json();
            })
            .then(sociedades => {
                const sociedadesFiltradas = sociedades.filter(s => s.País === paisSeleccionado);
                console.log(`Encontradas ${sociedadesFiltradas.length} sociedades para ${paisSeleccionado}`);
                
                // Limpiar y preparar el select de sociedades
                const $selectSociedad = $(sociedadNombre);
                $selectSociedad.empty().append(new Option('Seleccione una sociedad', '', true, true));
                
                // Agregar las sociedades encontradas
                if (sociedadesFiltradas.length > 0) {
                sociedadesFiltradas.forEach(sociedad => {
                        $selectSociedad.append(new Option(sociedad.Sociedad, sociedad.Sociedad));
                    });
                } else {
                    console.log('No se encontraron sociedades para el país seleccionado');
                    $selectSociedad.append(new Option('No hay sociedades disponibles', '', true, true));
                }
                
                // Habilitar y actualizar el select
                $selectSociedad.prop('disabled', false).trigger('change');
                console.log('Sociedades cargadas correctamente');
            })
            .catch(error => {
                console.error('Error al cargar las sociedades:', error);
                $(sociedadNombre)
                    .empty()
                    .append(new Option('Error al cargar las sociedades', '', true, true))
                    .prop('disabled', true)
                    .trigger('change');
            });
    }
    
    // Agregar event listeners
    btnAmbitos.forEach(btn => {
        btn.addEventListener('click', manejarSeleccionAmbito);
    });
    
    sociedadRadios.forEach(radio => {
        radio.addEventListener('change', toggleSociedadFields);
    });
    
    // Inicializar estado inicial
    actualizarClasesDisponibles();
    
    // Validación personalizada para asegurar que se seleccione al menos una clase
    const form = document.getElementById('socioForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            const formSection = document.querySelector('#datosTecnicos');
            if (formSection && formSection.classList.contains('active')) {
                // Validar que se haya seleccionado al menos un ámbito
                const ambitosSeleccionados = Array.from(btnAmbitos).filter(btn => btn.classList.contains('active'));
                if (ambitosSeleccionados.length === 0) {
                    event.preventDefault();
                    document.getElementById('ambitoError').textContent = 'Seleccione al menos un ámbito';
                    return;
                }
                
                // Validar que se haya seleccionado al menos una clase
                const checkboxes = document.querySelectorAll('.clase-option.activo input[type="checkbox"]:checked');
                if (checkboxes.length === 0) {
                    event.preventDefault();
                    document.getElementById('claseError').textContent = 'Seleccione al menos una clase';
                    return;
                }
                
                // Validar campos de sociedad si es necesario
                const sociedadSeleccionada = document.querySelector('input[name="perteneceSociedad"]:checked');
                if (sociedadSeleccionada && sociedadSeleccionada.value === 'si') {
                    if (!sociedadPais.value) {
                        event.preventDefault();
                        document.getElementById('sociedadPaisError').textContent = 'Seleccione un país';
                        return;
                    }
                    
                    if (!sociedadNombre.value) {
                        event.preventDefault();
                        document.getElementById('sociedadNombreError').textContent = 'Seleccione una sociedad';
                        return;
                    }
                }
                
                // Validar sección de obras
                const formSectionObras = document.querySelector('#obras');
                if (formSectionObras && formSectionObras.classList.contains('active')) {
                    const obras = document.querySelectorAll('.obra-item');
                    let obrasValidas = 0;
                    
                    obras.forEach(obra => {
                        const titulo = obra.querySelector('input[name="tituloObra[]"]');
                        const ambito = obra.querySelector('select[name="ambitoObra[]"]');
                        
                        if (titulo && ambito && titulo.value.trim() && ambito.value) {
                            obrasValidas++;
                        }
                    });
                    
                    if (obrasValidas === 0) {
                        event.preventDefault();
                        // Mostrar mensaje de error en la primera obra
                        const primeraObra = document.querySelector('.obra-item');
                        if (primeraObra) {
                            const errorTitulo = primeraObra.querySelector('.form-group:first-child .error-message');
                            const errorAmbito = primeraObra.querySelector('.form-group:last-child .error-message');
                            
                            if (errorTitulo) errorTitulo.textContent = 'Debe ingresar al menos una obra completa';
                            if (errorAmbito) errorAmbito.textContent = 'Debe seleccionar un ámbito';
                        }
                        return;
                    }
                }
            }
        });
    }
}

// Función para inicializar los selectores de código de país
async function inicializarSelectorCodigoPais() {
    try {
        const response = await fetch('assets/paisestel.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de códigos de país');
        }
        const paises = await response.json();
        
        // Configuración común para los selectores de código de país
        const configuracionSelectores = [
            { id: 'codigoPais', telefonoId: 'telefono' },
            { id: 'apoderadoCodigoPais', telefonoId: 'apoderadoTelefono' },
            { id: 'sucesionCodigoPais', telefonoId: 'sucesionTelefono' }
        ];
        
        // Ordenar países alfabéticamente
        paises.sort((a, b) => a.Paises.localeCompare(b.Paises));
        
        // Inicializar cada selector
        configuracionSelectores.forEach(config => {
            const select = document.getElementById(config.id);
            if (!select) return;
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccione un país</option>';
            
            // Limpiar opciones existentes
            select.innerHTML = '';
            
            // Agregar opciones y marcar Chile como seleccionado
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.textContent = `${pais.Paises} (${pais['Código tel']})`;
                option.value = pais['Código tel'];
                option.dataset.pais = pais.Paises;
                if (pais.Paises === 'Chile') {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            // Inicializar Select2
            $(select).select2({
                placeholder: 'Seleccione un país',
                templateResult: formatPais,
                templateSelection: formatPaisSeleccionado,
                width: '100%',
                dropdownAutoWidth: true,
                language: {
                    noResults: function() {
                        return "No se encontraron resultados";
                    },
                    searching: function() {
                        return "Buscando...";
                    }
                }
            });
            
            // Forzar la actualización visual
            if (select.id === 'codigoPais' || select.id === 'apoderadoCodigoPais') {
                $(select).val('+56').trigger('change');
            }
            
            // Validar que solo se ingresen números en el campo de teléfono correspondiente
            const telefonoInput = document.getElementById(config.telefonoId);
            if (telefonoInput) {
                telefonoInput.addEventListener('input', function(e) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                });
            }
        });
        
    } catch (error) {
        console.error('Error al cargar los códigos de país:', error);
    }
}

// Función para formatear la visualización de los países en el dropdown
function formatPais(pais) {
    if (!pais.id) { return pais.text; }
    const $pais = $(
        '<span>' + pais.text + '</span>'
    );
    return $pais;
}

// Función para formatear la visualización del país seleccionado
function formatPaisSeleccionado(pais) {
    if (!pais.id) { return 'Seleccione un país'; }
    return $('<span>' + pais.text + '</span>');
}

// Función para inicializar los grupos de entrada dinámica
function inicializarGruposDinamicos() {
    console.log("Intentando inicializar grupos dinámicos...");

    // Función helper para añadir el listener de eliminación
    function addRemoveListener(button, container, counter) {
        button.addEventListener('click', function() {
            removeInput(container, this.closest('.input-with-actions'), counter);
        });
    }

    // Manejador para agregar nuevos campos
    // Seleccionamos solo los botones que NO han sido inicializados
    document.querySelectorAll('.btn-add-input:not([data-initialized])').forEach(button => {
        console.log("Inicializando botón de AGREGAR:", button.getAttribute('data-target'));
        button.addEventListener('click', function() {
            // ... (código interno del click sin cambios)
            const targetId = this.getAttribute('data-target');
            const container = document.getElementById(targetId);
            const inputs = container.querySelectorAll('.input-with-actions');
            const counter = this.nextElementSibling;
            
            if (inputs.length >= 5) return;

            const template = inputs[0];
            const newInput = template.cloneNode(true);
            const inputField = newInput.querySelector('input[type="text"]');
            inputField.value = '';
            
            newInput.classList.remove('dynamic-input-exit');
            newInput.classList.add('dynamic-input-enter');
            
            const removeBtn = newInput.querySelector('.btn-remove-input');
            removeBtn.style.display = 'flex';
            
            addRemoveListener(removeBtn, container, counter);

            container.appendChild(newInput);
            updateCounter(counter, container);
            inputField.focus();
        });
        // Marcamos el botón como inicializado
        button.setAttribute('data-initialized', 'true');
    });
    
    // Función para actualizar el contador (código restaurado)
    function updateCounter(counter, container) {
        const currentCount = container.querySelectorAll('.input-with-actions').length;
        if(counter) counter.querySelector('.current-count').textContent = currentCount;
    }
    
    // Función para eliminar un campo (código restaurado)
    function removeInput(container, inputToRemove, counter) {
        const inputs = container.querySelectorAll('.input-with-actions');
        if (inputs.length <= 1) return;
        
        inputToRemove.classList.remove('dynamic-input-enter');
        inputToRemove.classList.add('dynamic-input-exit');
        
        setTimeout(() => {
            container.removeChild(inputToRemove);
            updateCounter(counter, container);
        }, 300);
    }
    
    // Inicializar listeners de eliminación para los campos existentes que no lo tengan
    document.querySelectorAll('.dynamic-input-container').forEach(container => {
        const removeButtons = container.querySelectorAll('.btn-remove-input:not([data-initialized])');
        const counter = container.closest('.dynamic-input-group').querySelector('.input-counter');
        
        removeButtons.forEach(btn => {
            const currentInput = btn.closest('.input-with-actions');
            const isFirst = currentInput === container.querySelector('.input-with-actions');
            if (!isFirst) {
                 console.log("Inicializando botón de ELIMINAR existente.");
                 addRemoveListener(btn, container, counter);
            }
            btn.setAttribute('data-initialized', 'true');
        });
    });

    // Inicializar contadores al cargar (código restaurado)
    document.querySelectorAll('.dynamic-input-group').forEach(group => {
        const container = group.querySelector('.dynamic-input-container');
        const counter = group.querySelector('.input-counter');
        if (container && counter) {
            updateCounter(counter, container);
        }
    });
}

// Inicializar grupos dinámicos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarGruposDinamicos();
});

// Función para inicializar la funcionalidad de obras dinámicas
function inicializarObrasDinamicas() {
    const obrasList = document.getElementById('obrasList');
    const btnAddObra = document.getElementById('btnAddObra');
    const obrasCounter = document.querySelector('.obras-counter .current-count');
    
    if (!obrasList || !btnAddObra) {
        console.error('Elementos de obras no encontrados');
        return;
    }
    
    let obraCount = 1;
    const maxObras = 10;
    
    // Función para actualizar el contador
    function updateObrasCounter() {
        if (obrasCounter) {
            obrasCounter.textContent = obraCount;
        }
        
        // Habilitar/deshabilitar botón de agregar
        btnAddObra.disabled = obraCount >= maxObras;
        
        // Mostrar/ocultar botones de eliminar
        const removeButtons = document.querySelectorAll('.btn-remove-obra');
        removeButtons.forEach((btn, index) => {
            btn.style.display = obraCount > 1 ? 'flex' : 'none';
        });
    }
    
    // Función para crear una nueva obra
    function createObraItem(obraId) {
        const obraItem = document.createElement('div');
        obraItem.className = 'obra-item obra-enter';
        obraItem.setAttribute('data-obra-id', obraId);
        
        obraItem.innerHTML = `
            <div class="obra-header">
                <span class="obra-number">Obra ${obraId}</span>
                <button type="button" class="btn-remove-obra" title="Eliminar obra">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label for="tituloObra${obraId}" class="form-label">Título <span class="required">*</span></label>
                    <input type="text" id="tituloObra${obraId}" name="tituloObra[]" class="form-control" placeholder="Ej: La obra de mi vida" required>
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <div class="floating-label">
                        <select id="ambitoObra${obraId}" name="ambitoObra[]" class="form-control select2" required>
                            <option value="">Seleccione un ámbito</option>
                            <option value="Audiovisual">Audiovisual</option>
                            <option value="Dramatico">Dramático</option>
                        </select>
                        <label for="ambitoObra${obraId}">Ámbito <span class="required">*</span></label>
                        <div class="error-message"></div>
                    </div>
                </div>
            </div>
        `;
        
        return obraItem;
    }
    
    // Función para agregar una nueva obra
    function addObra() {
        if (obraCount >= maxObras) return;
        
        obraCount++;
        const newObra = createObraItem(obraCount);
        obrasList.appendChild(newObra);
        
        // Inicializar Select2 para el nuevo select
        const newSelect = newObra.querySelector('select');
        if (newSelect) {
            $(newSelect).select2({
                placeholder: 'Seleccione un ámbito',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true
            });
        }
        
        // Agregar event listener para eliminar
        const removeBtn = newObra.querySelector('.btn-remove-obra');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeObra(newObra));
        }
        
        // Agregar event listeners para validación
        const tituloInput = newObra.querySelector('input[type="text"]');
        const ambitoSelect = newObra.querySelector('select');
        
        if (tituloInput) {
            tituloInput.addEventListener('blur', () => validarCampo(tituloInput));
            tituloInput.addEventListener('input', () => validarCampo(tituloInput));
        }
        
        if (ambitoSelect) {
            $(ambitoSelect).on('change', () => validarCampo(ambitoSelect));
        }
        
        updateObrasCounter();
        
        // Remover clase de animación después de la animación
        setTimeout(() => {
            newObra.classList.remove('obra-enter');
        }, 300);
        
        // Enfocar el nuevo campo de título
        setTimeout(() => {
            tituloInput.focus();
        }, 350);
    }
    
    // Función para eliminar una obra
    function removeObra(obraItem) {
        if (obraCount <= 1) return;
        
        obraItem.classList.add('obra-exit');
        
        setTimeout(() => {
            obrasList.removeChild(obraItem);
            obraCount--;
            
            // Renumerar las obras restantes
            const obrasRestantes = document.querySelectorAll('.obra-item');
            obrasRestantes.forEach((obra, index) => {
                const obraId = index + 1;
                obra.setAttribute('data-obra-id', obraId);
                const numeroSpan = obra.querySelector('.obra-number');
                if (numeroSpan) {
                    numeroSpan.textContent = `Obra ${obraId}`;
                }
                
                // Actualizar IDs de los campos
                const tituloInput = obra.querySelector('input[type="text"]');
                const ambitoSelect = obra.querySelector('select');
                
                if (tituloInput) {
                    tituloInput.id = `tituloObra${obraId}`;
                    const tituloLabel = obra.querySelector('label[for^="tituloObra"]');
                    if (tituloLabel) {
                        tituloLabel.setAttribute('for', `tituloObra${obraId}`);
                    }
                }
                
                if (ambitoSelect) {
                    ambitoSelect.id = `ambitoObra${obraId}`;
                    const ambitoLabel = obra.querySelector('label[for^="ambitoObra"]');
                    if (ambitoLabel) {
                        ambitoLabel.setAttribute('for', `ambitoObra${obraId}`);
                    }
                }
            });
            
            updateObrasCounter();
        }, 300);
    }
    
    // Event listener para agregar obra
    btnAddObra.addEventListener('click', addObra);
    
    // Event listeners para la primera obra
    const primeraObra = document.querySelector('.obra-item');
    if (primeraObra) {
        const tituloInput = primeraObra.querySelector('input[type="text"]');
        const ambitoSelect = primeraObra.querySelector('select');
        
        if (tituloInput) {
            tituloInput.addEventListener('blur', () => validarCampo(tituloInput));
            tituloInput.addEventListener('input', () => validarCampo(tituloInput));
        }
        
        if (ambitoSelect) {
            $(ambitoSelect).select2({
                placeholder: 'Seleccione un ámbito',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true
            });
            $(ambitoSelect).on('change', () => validarCampo(ambitoSelect));
        }
    }
    
    // Inicializar contador
    updateObrasCounter();
    
    console.log('Funcionalidad de obras dinámicas inicializada');
}

const totalSecciones = document.querySelectorAll('.form-section').length;
let datosGeneralesInicializados = false;

// Función para mostrar notificaciones visuales
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Elimina notificaciones previas
    const notiExistente = document.getElementById('noti-formulario');
    if (notiExistente) notiExistente.remove();
    // Crea el contenedor
    const noti = document.createElement('div');
    noti.id = 'noti-formulario';
    noti.textContent = mensaje;
    noti.style.position = 'fixed';
    noti.style.top = '30px';
    noti.style.left = '50%';
    noti.style.transform = 'translateX(-50%)';
    noti.style.padding = '16px 32px';
    noti.style.borderRadius = '8px';
    noti.style.zIndex = '9999';
    noti.style.fontSize = '1.1rem';
    noti.style.color = '#fff';
    noti.style.background = tipo === 'success' ? '#097137' : '#a0202d';
    noti.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    document.body.appendChild(noti);
    setTimeout(() => {
        noti.remove();
    }, 4000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Eliminar cualquier atributo 'required' residual en el DOM
  document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
});

function autocompletarFormularioPrueba() {
    // Esperar a que los selects estén poblados (por si hay carga asíncrona)
    setTimeout(() => {
        // Datos personales
        document.getElementById('nombres').value = 'Juan';
        document.getElementById('apellidoPaterno').value = 'Pérez';
        document.getElementById('apellidoMaterno').value = 'González';
        document.getElementById('nacionalidad').value = 'Chilena';
        $('#nacionalidad').trigger('change');
        document.getElementById('tipoDocumento').value = 'run-chileno';
        $('#tipoDocumento').trigger('change');
        document.getElementById('run').value = '12.345.678-9';
        document.getElementById('idOrigen').value = '';
        document.getElementById('fechaNacimiento').value = '1980-05-15';
        document.getElementById('fechaDefuncion').value = '';
        document.getElementById('genero').value = 'masculino';
        $('#genero').trigger('change');
        document.getElementById('seudonimo').value = 'El Dramaturgo';

        // Contacto
        document.getElementById('paisResidencia').value = 'Chile';
        $('#paisResidencia').trigger('change');
        setTimeout(() => {
            document.getElementById('region').value = 'Región Metropolitana';
            $('#region').trigger('change');
            setTimeout(() => {
                document.getElementById('comuna').value = 'Santiago';
                $('#comuna').trigger('change');
            }, 300);
        }, 300);
        document.getElementById('direccion').value = 'Av. Libertador 1234';
        document.getElementById('detalleDireccion').value = 'Depto 45B';
        document.getElementById('email').value = 'juan.perez@email.com';
        document.getElementById('codigoPais').value = '+56';
        document.getElementById('telefono').value = '912345678';

        // Apoderado
        document.getElementById('apoderadoNombres').value = 'María';
        document.getElementById('apoderadoApellidoPaterno').value = 'López';
        document.getElementById('apoderadoApellidoMaterno').value = 'Ramírez';
        document.getElementById('apoderadoEmail').value = 'maria.lopez@email.com';
        document.getElementById('apoderadoCodigoPais').value = '+56';
        document.getElementById('apoderadoTelefono').value = '987654321';

        // Sucesión
        document.getElementById('sucesionNombres').value = 'Carlos';
        document.getElementById('sucesionApellidoPaterno').value = 'Soto';
        document.getElementById('sucesionApellidoMaterno').value = 'Mena';
        document.getElementById('sucesionEmail').value = 'carlos.soto@email.com';
        document.getElementById('sucesionCodigoPais').value = '+56';
        document.getElementById('sucesionTelefono').value = '998877665';

        // Ámbito (activar ambos)
        document.getElementById('ambitoAudiovisual').value = 'Audiovisual';
        document.getElementById('ambitoDramatico').value = 'Dramático';

        // Clases (marcar algunos checkboxes)
        ['claseDirector', 'claseGuionista', 'claseDramaturgo'].forEach(id => {
            const cb = document.getElementById(id);
            if (cb) cb.checked = true;
        });

        // Sociedad
        const radioSi = document.querySelector('input[name="perteneceSociedad"][value="si"]');
        if (radioSi) radioSi.checked = true;
        document.getElementById('sociedadPais').disabled = false;
        document.getElementById('sociedadNombre').disabled = false;
        document.getElementById('sociedadPais').value = 'Argentina';
        $('#sociedadPais').trigger('change');
        setTimeout(() => {
            document.getElementById('sociedadNombre').value = 'ARGENTORES';
            $('#sociedadNombre').trigger('change');
        }, 300);
    }, 800); // Espera para asegurar que los selects estén listos
}
document.addEventListener('DOMContentLoaded', autocompletarFormularioPrueba);

let formularioEnviado = false;
