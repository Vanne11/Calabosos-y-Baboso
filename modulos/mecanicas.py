#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de mecánicas para el juego de aventuras conversacional.
Maneja las reglas del juego, tiradas de dados y resolución de acciones.
"""

import random
import time
from rich.console import Console

# Importar módulos del juego
from . import estado
from . import utilidades
from . import cargador
from . import interfaz

# Importar configuración
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DIFICULTAD_ACTUAL

# Inicializar consola para salida
console = Console()

def tirada_dados(dificultad=10, stat=None, inverso=False):
    """
    Realiza una tirada de dados D20 con modificadores.
    
    Args:
        dificultad (int): Dificultad que debe superarse
        stat (str): Estadística que afecta a la tirada
        inverso (bool): Si el modificador se aplica de forma inversa
    
    Returns:
        tuple: (resultado_base, resultado_modificado, éxito)
    """
    # Obtener valor base (D20)
    resultado = random.randint(1, 20)
    
    # Calcular modificador si se proporciona una estadística
    modificador = 0
    if stat and stat in estado.obtener_stats():
        valor_stat = estado.obtener_stat(stat)
        # Convertir valor (0-100) a modificador (-5 a +5)
        modificador = (valor_stat - 50) // 10
        
        utilidades.log_debug(f"Stat '{stat}': {valor_stat} -> Modificador: {modificador}")
    
    # Aplicar modificador de dificultad global
    modificador_dificultad = DIFICULTAD_ACTUAL.get("modificador_tiradas", 0)
    modificador_total = modificador + modificador_dificultad
    
    # Calcular resultado modificado
    if inverso:
        resultado_modificado = resultado - modificador_total
    else:
        resultado_modificado = resultado + modificador_total
    
    # Mostrar la tirada en la interfaz
    interfaz.mostrar_tirada_dados(resultado, dificultad, modificador_total, inverso)
    
    # Determinar si es éxito
    exito = resultado_modificado >= dificultad
    
    return (resultado, resultado_modificado, exito)

def encontrar_resultado_tirada(tirada_info, valor_resultado):
    """
    Encuentra el resultado correspondiente a un valor de tirada.
    
    Args:
        tirada_info (dict): Información de la tirada
        valor_resultado (int): Valor obtenido en la tirada
    
    Returns:
        dict: El resultado correspondiente o None
    """
    # Un valor de 1 siempre es "pifia" (falló crítico)
    if valor_resultado == 1:
        for resultado in tirada_info.get("resultados", []):
            rango = resultado.get("rango", [0, 0])
            if rango[0] == 1 and rango[1] == 1:
                return resultado
    
    # Un valor de 20 siempre es "crítico" (éxito crítico)
    if valor_resultado == 20:
        for resultado in tirada_info.get("resultados", []):
            rango = resultado.get("rango", [0, 0])
            if rango[0] == 20 and rango[1] == 20:
                return resultado
    
    # Buscar el rango que incluye el valor
    for resultado in tirada_info.get("resultados", []):
        rango = resultado.get("rango", [0, 0])
        if rango[0] <= valor_resultado <= rango[1]:
            return resultado
    
    # Si no encuentra ningún rango adecuado
    utilidades.log_debug(f"No se encontró resultado para el valor {valor_resultado}")
    return None

def procesar_tirada(ruta_id):
    """
    Procesa una tirada de dados asociada a una ruta.
    
    Args:
        ruta_id (str): ID de la ruta que contiene la tirada
    
    Returns:
        str: ID de la siguiente ruta o None
    """
    # Obtener información de la ruta
    ruta = cargador.buscar_ruta(ruta_id)
    if not ruta or "tirada" not in ruta:
        utilidades.log_debug(f"Ruta {ruta_id} no tiene tirada asociada")
        return None
    
    # Obtener información de la tirada
    tirada_info = ruta["tirada"]
    stat = tirada_info.get("stat", "reputacion")
    dificultad = tirada_info.get("dificultad", 10)
    inverso = tirada_info.get("inverso", False)
    
    # Verificar condiciones especiales si existen
    condicion = tirada_info.get("condicion")
    if condicion:
        tiene_condicion = verificar_condicion(condicion)
        if not tiene_condicion:
            interfaz.mostrar_advertencia(f"No cumples la condición necesaria: {condicion}")
            # Aquí podrías implementar un camino alternativo
    
    # Cargar la tirada completa para obtener resultados
    tirada_completa = cargador.cargar_tirada(ruta_id)
    if not tirada_completa:
        interfaz.mostrar_error(f"No se pudo cargar la información completa de la tirada: {ruta_id}")
        return None
    
    # Mostrar información de la tirada
    console.print(f"\n[bold]Realizando prueba de [cyan]{stat.upper()}[/cyan][/bold]")
    console.print(f"Dificultad: [bold]{dificultad}[/bold]")
    
    # Esperar un momento para crear tensión
    time.sleep(1)
    
    # Realizar la tirada
    resultado_base, resultado_modificado, exito = tirada_dados(dificultad, stat, inverso)
    
    # Obtener el resultado específico según el valor
    resultado_info = encontrar_resultado_tirada(tirada_completa, resultado_base)
    if not resultado_info:
        interfaz.mostrar_error("No se pudo determinar el resultado de la tirada")
        return None
    
    # Mostrar descripción del resultado
    texto_resultado = resultado_info.get("texto", "")
    respuesta_npc = resultado_info.get("respuesta_npc")
    
    # Resolver referencias en el texto
    texto_resultado = cargador.resolver_referencias(texto_resultado)
    if respuesta_npc:
        respuesta_npc = cargador.resolver_referencias(respuesta_npc)
    
    # Mostrar resultado
    interfaz.mostrar_resultado_tirada(texto_resultado, respuesta_npc)
    
    # Aplicar efectos
    if "efectos" in resultado_info:
        aplicar_efectos(resultado_info["efectos"])
        interfaz.mostrar_efectos(resultado_info["efectos"])
    
    # Si hay una siguiente ruta específica en el resultado, usarla
    if "siguiente_ruta" in resultado_info:
        return resultado_info["siguiente_ruta"]
    
    # De lo contrario, continuar con la primera conexión de la ruta
    conexiones = ruta.get("conexiones", [])
    return conexiones[0] if conexiones else None

def verificar_condicion(condicion):
    """
    Verifica si se cumple una condición específica.
    
    Args:
        condicion (str): Nombre de la condición a verificar
        
    Returns:
        bool: True si se cumple, False en caso contrario
    """
    # Verificar diferentes tipos de condiciones
    if condicion == "tiene_sal":
        return estado.tiene_objeto("Saco de sal")
    elif condicion == "nerly_confia":
        return estado.obtener_flag("nerly_confia")
    elif condicion == "conoce_secreto":
        return estado.obtener_flag("conoce_secreto_rey")
    
    # Condición desconocida
    utilidades.log_debug(f"Condición desconocida: {condicion}")
    return False

def aplicar_efectos(efectos):
    """
    Aplica los efectos definidos en un resultado.
    
    Args:
        efectos (dict): Diccionario con los efectos a aplicar
    """
    for clave, valor in efectos.items():
        # Efectos en estadísticas
        if clave in estado.obtener_stats():
            estado.modificar_stat(clave, valor)
        
        # Objetos ganados
        elif clave == "objetos":
            for objeto in valor:
                estado.añadir_objeto(objeto)
        
        # Objetos perdidos
        elif clave == "objetos_perdidos":
            for objeto in valor:
                estado.quitar_objeto(objeto)
        
        # Activar flags
        elif clave == "flags":
            if isinstance(valor, dict):
                for flag_nombre, flag_valor in valor.items():
                    estado.establecer_flag(flag_nombre, flag_valor)
            else:
                # Si es una lista, establecer todos a True
                for flag in valor:
                    estado.establecer_flag(flag, True)
        
        # Establecer variables
        elif clave == "variables":
            for var_nombre, var_valor in valor.items():
                estado.establecer_variable(var_nombre, var_valor)
        
        # Estados temporales (como efectos de estado)
        elif clave == "estado_temporal":
            # Aquí podrías implementar lógica para efectos temporales
            utilidades.log_debug(f"Estado temporal aplicado: {valor}")

def procesar_ruta(ruta_id):
    """
    Procesa una ruta del juego, mostrando escenario, diálogos y opciones.
    
    Args:
        ruta_id (str): ID de la ruta a procesar
        
    Returns:
        str: ID de la siguiente ruta o None
    """
    utilidades.log_debug(f"========== PROCESANDO RUTA: {ruta_id} ==========")
    
    # Buscar la ruta en los datos
    ruta = cargador.buscar_ruta(ruta_id)
    if not ruta:
        interfaz.mostrar_error(f"Ruta '{ruta_id}' no encontrada")
        return None
    
    # Registrar que hemos visitado esta ruta
    estado.marcar_ruta_visitada(ruta_id)
    
    # Limpiar pantalla para la nueva escena
    interfaz.limpiar_pantalla()
    
    # Mostrar título y escenario
    console.print(f"\n[bold magenta]===== {ruta.get('nombre', 'Sin nombre')} =====[/bold magenta]")
    interfaz.mostrar_escenario(ruta)
    
    # Verificar si es una ruta con tirada de dados
    if "tirada" in ruta:
        # Es una tirada de dados (desafío aleatorio)
        utilidades.log_debug(f"Procesando tirada para ruta: {ruta_id}")
        return procesar_tirada(ruta_id)
    
    # Cargar y mostrar diálogo asociado al escenario
    escenario_id = ruta.get("escenario", "")
    dialogo = cargador.cargar_dialogo(escenario_id)
    
    if dialogo:
        # Mostrar la secuencia de diálogo
        interfaz.mostrar_secuencia(dialogo.get("secuencia", []))
        
        # Mostrar opciones y obtener selección del jugador
        siguiente_ruta = interfaz.mostrar_opciones(dialogo.get("opciones", []), ruta_id)
        
        utilidades.log_debug(f"Siguiente ruta seleccionada: {siguiente_ruta}")
        return siguiente_ruta
    
    # Si no hay diálogo asociado, usar las conexiones directas de la ruta
    conexiones = ruta.get("conexiones", [])
    if conexiones:
        # Crear opciones a partir de las conexiones
        opciones = []
        for conexion_id in conexiones:
            ruta_conexion = cargador.buscar_ruta(conexion_id)
            if ruta_conexion:
                opciones.append({
                    "texto": f"Ir a {ruta_conexion.get('nombre', conexion_id)}",
                    "siguiente_ruta": conexion_id
                })
        
        # Mostrar opciones y obtener selección
        siguiente_ruta = interfaz.mostrar_opciones(opciones, ruta_id)
        
        utilidades.log_debug(f"Siguiente ruta seleccionada desde conexiones: {siguiente_ruta}")
        return siguiente_ruta
    
    # Si llegamos aquí, no hay forma de continuar
    interfaz.mostrar_advertencia("No hay opciones disponibles para continuar.")
    return None

def resolver_conflicto(tipo_conflicto, dificultad=10, stat="reputacion"):
    """
    Resuelve un conflicto genérico mediante una tirada de dados.
    Esta función puede usarse cuando necesites una tirada que no esté
    asociada a una ruta específica.
    
    Args:
        tipo_conflicto (str): Tipo de conflicto ("combate", "social", etc.)
        dificultad (int): Dificultad a superar
        stat (str): Estadística utilizada
        
    Returns:
        bool: True si tiene éxito, False en caso contrario
    """
    console.print(f"\n[bold]Resolviendo conflicto de tipo '[cyan]{tipo_conflicto}[/cyan]'[/bold]")
    console.print(f"Usando [cyan]{stat}[/cyan] contra dificultad [bold]{dificultad}[/bold]")
    
    # Realizar tirada
    _, _, exito = tirada_dados(dificultad, stat)
    
    # Mostrar resultado
    if exito:
        console.print("[bold green]¡Éxito![/bold green]")
    else:
        console.print("[bold red]Fracaso[/bold red]")
    
    # Esperar confirmación del usuario
    input("\nPresiona Enter para continuar...")
    return exito

def calcular_daño(base, stat="ganas_de_vivir"):
    """
    Calcula el daño en un conflicto.
    
    Args:
        base (int): Daño base
        stat (str): Estadística que modifica el daño
        
    Returns:
        int: Daño calculado
    """
    # Obtener modificador de daño según dificultad
    mod_dificultad = DIFICULTAD_ACTUAL.get("daño_recibido", 1.0)
    
    # Calcular daño con modificador de estadística
    valor_stat = estado.obtener_stat(stat)
    modificador = (valor_stat - 50) // 20  # Menos impacto que en tiradas
    
    daño_final = int(base * mod_dificultad) - modificador
    daño_final = max(1, daño_final)  # Mínimo 1 de daño
    
    utilidades.log_debug(f"Daño calculado: {base} (base) * {mod_dificultad} (dificultad) - {modificador} (stat) = {daño_final}")
    return daño_final

def resolver_acertijo(respuesta_correcta, pista=None, intentos=3):
    """
    Implementa un acertijo o puzzle de texto.
    
    Args:
        respuesta_correcta (str): La respuesta correcta
        pista (str, optional): Una pista opcional
        intentos (int): Número máximo de intentos
        
    Returns:
        bool: True si el jugador acierta, False en caso contrario
    """
    respuesta_correcta = respuesta_correcta.lower().strip()
    
    for i in range(intentos):
        intentos_restantes = intentos - i
        console.print(f"\n[bold]Intentos restantes: {intentos_restantes}[/bold]")
        
        if pista and intentos_restantes <= intentos // 2:
            console.print(f"[yellow]Pista: {pista}[/yellow]")
        
        respuesta = input("Tu respuesta: ").lower().strip()
        
        if respuesta == respuesta_correcta:
            console.print("[bold green]¡Correcto![/bold green]")
            return True
        else:
            console.print("[bold red]Incorrecto.[/bold red]")
    
    console.print(f"\n[yellow]Se acabaron los intentos. La respuesta correcta era: {respuesta_correcta}[/yellow]")
    return False

def resolver_eleccion_moral(opciones, consecuencias=None):
    """
    Presenta al jugador una elección moral que afectará a su reputación.
    
    Args:
        opciones (list): Lista de opciones disponibles
        consecuencias (dict, optional): Efectos para cada opción
        
    Returns:
        int: Índice de la opción elegida
    """
    console.print("\n[bold purple]Una decisión importante...[/bold purple]")
    
    for i, opcion in enumerate(opciones, 1):
        console.print(f"[green]{i}. {opcion}[/green]")
    
    while True:
        try:
            eleccion = int(input("\nTu elección: "))
            if 1 <= eleccion <= len(opciones):
                break
            console.print("[red]Opción no válida. Intenta de nuevo.[/red]")
        except ValueError:
            console.print("[red]Por favor, introduce un número.[/red]")
    
    indice = eleccion - 1
    
    # Aplicar consecuencias si existen
    if consecuencias and indice in consecuencias:
        efectos = consecuencias[indice]
        aplicar_efectos(efectos)
        interfaz.mostrar_efectos(efectos)
    
    return indice

def aplicar_evento_aleatorio(eventos, probabilidades=None):
    """
    Aplica un evento aleatorio de una lista de posibles eventos.
    
    Args:
        eventos (list): Lista de eventos posibles
        probabilidades (list, optional): Lista de probabilidades para cada evento
        
    Returns:
        dict: El evento seleccionado
    """
    if not eventos:
        return None
    
    # Si no se proporcionan probabilidades, considerar equiprobables
    if not probabilidades or len(probabilidades) != len(eventos):
        probabilidades = [1/len(eventos)] * len(eventos)
    
    # Seleccionar evento según probabilidades
    evento = random.choices(eventos, weights=probabilidades, k=1)[0]
    
    # Mostrar descripción del evento
    if "descripcion" in evento:
        console.print(f"\n[bold yellow]¡Evento aleatorio![/bold yellow]")
        console.print(evento["descripcion"])
    
    # Aplicar efectos si existen
    if "efectos" in evento:
        aplicar_efectos(evento["efectos"])
        interfaz.mostrar_efectos(evento["efectos"])
    
    return evento

def comprobar_fin_juego():
    """
    Comprueba si se cumplen condiciones para el fin del juego.
    
    Returns:
        tuple: (fin_juego, tipo_fin, mensaje)
    """
    # Comprobar si el personaje ha "muerto" (ganas_de_vivir <= 0)
    if estado.obtener_stat("ganas_de_vivir") <= 0:
        return (True, "derrota", "Has perdido todas tus ganas de vivir. Tu aventura ha terminado.")
    
    # Comprobar victoria por bandera específica
    if estado.obtener_flag("victoria_conseguida"):
        return (True, "victoria", "¡Has completado tu misión con éxito!")
    
    # Sin condiciones de fin
    return (False, None, None)