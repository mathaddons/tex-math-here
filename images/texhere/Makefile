density = 600x600
quality = 100
resolutions = 440x280 920x680
logo = texhere

pdf:
	pdflatex $(logo).tex

.PHONY: logo $(resolutions)
logo: pdf $(resolutions)

$(resolutions):/home/npgentry/org/data/21/a498e9-0b6b-4196-9dee-9106fb8b7766/tex-math-here/icons/texhere
	convert -density $(density) $(logo).pdf \
		-quality $(quality) \
		-resize $@ $(logo)-$@.png

.PHONY: clean
clean :
	rm -f *.aux *.log *.pdf *.png
