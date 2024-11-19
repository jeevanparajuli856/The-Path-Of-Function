# def fahr(fahren):
#     celsius = (5/9) * (fahren-32)
#     celsius = round(celsius,2)
#     return celsius
# def main():
#     celsius = fahr(100)
#     print("\nConverted Temperature: "+str(celsius)+chr(176))
# main()

def calculate_area(length, width):
    area = length * width
    return area

def main():
    length = 10
    width = 5
    area = calculate_area(length, width)
    print(f"The area of the rectangle is {area} square units.")
main()