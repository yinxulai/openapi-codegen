package go_server

type Service struct {
	
}

type Router struct {
	service Service
	router Gin.Router
}

func (r *Router) Init() {
	router.GET("", r.)
}
