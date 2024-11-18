def fahr(fahren):
    celsius = (5/9) * (fahren-32)
    celsius = round(celsius,2)
    return celsius
def main():
    celsius = fahr(100)
    print("\nConverted Temperature: "+str(celsius)+chr(176))
main()