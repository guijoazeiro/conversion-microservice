package converter

import (
	"context"
	"fmt"
	"strings"
)

type Converter interface {
	Convert(ctx context.Context, input, format, output string) error
	SupportedFormats() []string
}

type Registry struct {
	converters map[string]Converter
}

func NewRegistry() Registry {
	registry := Registry{
		converters: make(map[string]Converter),
	}

	registry.converters["image"] = &ImageConverter{}
	registry.converters["audio"] = &AudioConverter{}
	registry.converters["video"] = &VideoConverter{}

	return registry
}

func (r *Registry) GetConverter(mimetype string) (Converter, error) {
	mediaType := strings.Split(mimetype, "/")[0]

	converter, exists := r.converters[mediaType]
	if !exists {
		return nil, fmt.Errorf("unsupported media type: %s", mediaType)
	}

	return converter, nil
}

func (r *Registry) ListSupportedTypes() []string {
	types := make([]string, 0, len(r.converters))
	for mediaType := range r.converters {
		types = append(types, mediaType)
	}
	return types
}

type BaseConverter struct {
	name string
}

func (b *BaseConverter) validatePaths(input, output string) error {
	if input == "" {
		return fmt.Errorf("input path cannot be empty")
	}
	if output == "" {
		return fmt.Errorf("output path cannot be empty")
	}
	return nil
}
