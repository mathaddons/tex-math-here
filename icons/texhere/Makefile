density = 600x600
quality = 100
resolutions = 440x280 920x680
logo = texhere

pdf:
	pdflatex $(logo).tex

.PHONY: logo $(resolutions)
logo: pdf $(resolutions)

$(resolutions):
	convert -density $(density) $(logo).pdf \
		-quality $(quality) \
		-resize $@ $(logo)-$@.png

.PHONY: clean
clean :
	rm -f *.aux *.log *.pdf *.png
