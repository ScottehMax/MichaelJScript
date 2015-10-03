#!/bin/bash

mogrify -format png -fill "rgb(100,100,16)" -opaque "rgb(64,64,64)" *.png
mogrify -format png -fill "rgb(232,232,92)" -opaque "rgb(108,108,108)" *.png
