chkerror(){
if [ $1 -ne 0 ] ; then
  echo "ERROR, exiting."
#  return
  exit
fi
}

drop_db(){
  echo "DROPPING THE DATABASE:"
  psql -U postgres -c 'DROP DATABASE ddn_db;'
  chkerror $?
}

create_db(){
  echo "Re-creating the database:"
  psql -U postgres -c 'CREATE DATABASE ddn_db;'
  chkerror $?
}

drop_db
create_db

