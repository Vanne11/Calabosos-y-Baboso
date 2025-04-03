#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Archivo de configuración para el juego de aventuras conversacional.
Define constantes y ajustes globales que se utilizan en todo el juego.
"""

import os

# Información general del juego
NOMBRE_JUEGO = "AVENTURA CONVERSACIONAL"  # Modifica este título según tu juego
DESCRIPCION_JUEGO = "Una aventura interactiva donde tus decisiones importan"
VERSION = "1.0.0"

# Modos y configuraciones
DEBUG = False  # Por defecto desactivado, se puede activar con --debug
DEBUG_NIVEL = "INFO"  # Niveles: "INFO", "DEBUG", "VERBOSE"
DEBUG_GUARDAR_LOGS = True  # Si se guardan logs en archivos
DEBUG_DIRECTORIO = "logs"  # Directorio para archivos de log

# Rutas de directorios y archivos
DIR_BASE = os.path.dirname(os.path.abspath(__file__))
DIR_DATOS = os.path.join(DIR_BASE, "datos")
DIR_RECURSOS = os.path.join(DIR_BASE, "recursos")

# Archivos de datos
ARCHIVO_RUTAS = os.path.join(DIR_DATOS, "rutas_completo.json")
ARCHIVO_DIALOGOS = os.path.join(DIR_DATOS, "historia_completo.json")
ARCHIVO_TIRADAS = os.path.join(DIR_DATOS, "combate_completo.json")
ARCHIVO_RELLENO = os.path.join(DIR_DATOS, "relleno_completo.json")

# Configuración de guardado de partidas
DIR_GUARDADO = os.path.join(DIR_BASE, "guardado")
EXTENSION_GUARDADO = ".save"

# Asegurar que existan los directorios necesarios
for directorio in [DIR_DATOS, DIR_RECURSOS, DIR_GUARDADO]:
    os.makedirs(directorio, exist_ok=True)

# Configuración de la interfaz
ANCHO_TERMINAL = 80
COLOR_TITULO = "magenta"
COLOR_TEXTO_NORMAL = "white"
COLOR_DIALOGO_NARRADOR = "yellow"
COLOR_DIALOGO_PROTAGONISTA = "cyan"
COLOR_DIALOGO_NPC = "green"
COLOR_ERROR = "red"
COLOR_ADVERTENCIA = "yellow"
COLOR_EXITO = "green"
COLOR_INFO = "blue"

# Configuración del sistema de juego
STATS_INICIAL = {
    "ganas_de_vivir": 100,
    "hambre_intensa": 0,
    "pipi_acumulado": 0,
    "miedo": 0,
    "reputacion": 50
}

# Configuración de dificultad
DIFICULTAD_FACIL = {
    "nombre": "Fácil",
    "modificador_tiradas": 2,  # Bonus a todas las tiradas
    "daño_recibido": 0.75,     # Reduce el daño recibido
}

DIFICULTAD_NORMAL = {
    "nombre": "Normal",
    "modificador_tiradas": 0,
    "daño_recibido": 1.0,
}

DIFICULTAD_DIFICIL = {
    "nombre": "Difícil",
    "modificador_tiradas": -2,  # Penalización a todas las tiradas
    "daño_recibido": 1.25,      # Aumenta el daño recibido
}

# Dificultad por defecto
DIFICULTAD_ACTUAL = DIFICULTAD_NORMAL