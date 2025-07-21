package converter

import (
	"strings"
)

type Converter interface {
	Convert(input, format, output string) error
}

func GetHandler(mimetype string) Converter {
	mtype := strings.Split(mimetype, "/")[0]

	switch mtype {
	case "image":
		return &ImageConverter{}
	case "audio":
		return &AudioConverter{}
	case "video":
		return &VideoConverter{}
	default:
		return nil
	}
}
