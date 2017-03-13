if [ ! -e run.sh ] ; then
  echo "You're in the wrong directory."
  exit
fi

echo "Building fake-data:" && \
node models/database.js && \
echo "Running server:" && \
npm start
