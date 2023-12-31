package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	icon, _ := assets.ReadFile("./favicon.ico")
	app := application.New(application.Options{
		Name:        "OSNR",
		Description: "Multi-Segment OSNR calculation program",
		Assets: application.AssetOptions{
			FS: assets,
		},
		Icon: icon,
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	// Create window
	mainWindow := app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title: "OSNR",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		URL: "/",
	})
	mainWindow.Maximise()

	app.Events.On("errMessage", func(e *application.WailsEvent) {
		dialog := application.ErrorDialog()
		dialog.SetTitle("Error")
		dialog.SetMessage(e.Data.(string))
		dialog.Show()
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
