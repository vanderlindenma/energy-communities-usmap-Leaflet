library(tidyverse)
library(readxl)
library(rgdal)

geo <- read_xls("counties_geo.xls")
ctis <- read_xlsx("data.xlsx", sheet = 2)

test <- left_join(geo, ctis, by = c(GEOID = "fip"))

for(colname in c("cpr",
                 "opr",
                 "ngp",
                 "clc",
                 "ngc",
                 "orc",
                 "cpq",
                 "opq",
                 "npq",
                 "clq",
                 "ncq",
                 "orq")){
  
  print(colname)
  new_col_name <- paste0(colname,"_scaled")
  new_max_name <- paste0(colname,"_max")
  new_min_name <- paste0(colname,"_min")
  col_vec <- test[colname] %>% unlist() %>% as.double()
  max <- max(col_vec, na.rm = T) 
  min <- min(col_vec, na.rm = T) 
  new <- ((col_vec - min)/(max - min)) %>% sapply(function(x){x^(0.6)})
  
  test <- test %>% 
            mutate(!!sym(new_col_name) := new)
}

for(colname in c("ecd",
                 "bdg",
                 "rur",
                 "shm",
                 "shl",
                 "shp",
                 "atc",
                 "twd",
                 "sfs",
                 "aoz",
                 "apm")){
  
  print(colname)
  new_max_name <- paste0(colname,"_max")
  new_min_name <- paste0(colname,"_min")
  col_vec <- test[colname] %>% unlist() %>% as.double()
  max <- max(col_vec, na.rm = T) 
  min <- min(col_vec, na.rm = T) 
  
  test <- test %>% 
    mutate(!!sym(new_max_name) := max) %>%
    mutate(!!sym(new_min_name) := min)
}

#Write as geojson

# Lat on col 9 and long on col 10
test.SP  <- SpatialPointsDataFrame(test[,c(10,9)],test[,-c(10,9)])
str(test.SP) # Now is class SpatialPointsDataFrame

writeOGR(test.SP, 'merged_counties.geojson','dataMap', driver='GeoJSON')
