
Params:

extent: string with coords separated by spaces "minx miny maxx maxy"
crs: srid of extent. If none, assume same srid 4326 (WGS84)


Examples

http://localhost:4200/mapa/demo?type=WMS&url=https://geo.example.com/geoserver/wms&layers=cm_castro_verde:cadastralparcel&title=Cadastro&extent=-8.246159615269114%2037.56102590072076%20-7.8484607803015685%2037.827464525074866&crs=EPSG:4326&styles=polygon&servertype=geoserver

