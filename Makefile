UUID := pip-corner@v9eq.github.io
STAGE := $(CURDIR)/.build/extension
EXTRA_JS := $(filter-out extension.js prefs.js,$(notdir $(wildcard src/*.js)))

.PHONY: all check pack install clean

all: pack

check:
	@for file in src/*.js; do node --input-type=module --check < "$$file" || exit; done
	@if test -d schemas; then glib-compile-schemas --strict --dry-run schemas; fi
	git diff --check

pack: check
	rm -rf "$(STAGE)"
	mkdir -p "$(STAGE)" dist
	cp src/*.js src/metadata.json LICENSE "$(STAGE)/"
	@if test -d schemas; then mkdir -p "$(STAGE)/schemas"; cp schemas/*.gschema.xml "$(STAGE)/schemas/"; fi
	gnome-extensions pack --force --out-dir=dist \
		$(if $(wildcard schemas/*.gschema.xml),--schema=schemas/$(notdir $(wildcard schemas/*.gschema.xml))) \
		$(addprefix --extra-source=,$(EXTRA_JS)) --extra-source=LICENSE "$(STAGE)"

install: pack
	gnome-extensions install --force dist/$(UUID).shell-extension.zip
	@echo 'Log out and back in, then run: gnome-extensions enable $(UUID)'

clean:
	rm -rf .build dist
